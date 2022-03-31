//jshint esversion:6
const pass = process.env.HERO_PW;
const user = process.env.HERO_USER;

require('dotenv').config();
const express = require("express");
//require the Mongoose package (after running >npm i mongoose in Hyper to install it)
const mongoose = require('mongoose');

const _= require('lodash');
    
//connect to MongoDB by specifying port to access MongoDB server
main().catch(err => console.log(err));
  
async function main() {
  await mongoose.connect('mongodb+srv://' + user + ':' + pass + '@cluster0.8jid4.mongodb.net/todolistDB');
}

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));


const itemSchema = new mongoose.Schema({
  name: String
});

const Item = new mongoose.model ("Item", itemSchema);

const keyboard = new Item ({
  name: "Zephyr 65"
});
const helicopter = new Item ({
  name: "Joby Mark II"
});
const phone = new Item ({
  name: "Galaxy S6"
});

const defaultItems = [keyboard, helicopter, phone];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = new mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err){
          if (err) {
            console.log(err);
          } else {
            console.log("successfully saved all items to items db");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    }
  });
});

app.get("/:customListName", function(req,res) {
  // const requestTitle = _.lowerCase(req.params.page);
   const customListName = _.capitalize(req.params.customListName);

   List.findOne({name: customListName}, function(err, foundList) {
     if (err) {
       console.log(err);
     } else {
       if (!foundList) {
         const list = new List({
           name: customListName,
           items: defaultItems
          });
          list.save(err => {
            res.redirect("/" + customListName);
          });
       } else {
         res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
       }
     }
   });
 });

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item ({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      if (err) {
        console.log(err);
      } else {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function(req, res){

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    console.log(listName);
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (err) {
        console.log(err);
      } else {
        console.log("successfully removed item from database");
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate( {name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }

});


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});