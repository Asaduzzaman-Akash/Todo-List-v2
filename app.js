const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todoListDB");
const itemsSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Welcome to your todoList!",
});
const item2 = new Item({
  name: "Hit the + button to add new item.",
});
const item3 = new Item({
  name: "<-- Hit this button to delete item.",
});
const defaultItems = [item1, item2, item3];

const listsSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listsSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to Database!");
        }
        res.redirect("/");
      });
    } else {
      res.render("list", {
        currentDay: "Today",
        items: foundItems,
      });
    }
  });
});

app.post("/", function (req, res) {
  const listName = req.body.list;
  const newItem = req.body.newItem;
  const item = new Item({
    name: newItem,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
    });
    res.redirect("/" + listName);
  }
});

app.post("/delete", function (req, res) {
  const checkedId = req.body.checkbox;
  const listTitle = req.body.listTitle;
  if (listTitle === "Today") {
    Item.findByIdAndRemove(checkedId, function (err) {
      if (!err) {
        console.log("Successfully deleted checked item");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listTitle },
      { $pull: { items: { _id: checkedId } } },
      function (err, foundList) {
        if (!err) {
          console.log("Successfully deleted checked item");
        }
      }
    );
    res.redirect("/" + listTitle);
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          currentDay: foundList.name,
          items: foundList.items,
        });
      }
    }
  });
});

app.listen(3000, function () {
  console.log("server started on port 3000!");
});
