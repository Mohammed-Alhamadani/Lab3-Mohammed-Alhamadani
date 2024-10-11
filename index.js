const express = require("express");
const path = require("path"); //the path module contains useful methods for manipulating/defining file paths
const { MongoClient, ObjectId } = require("mongodb");
const { link } = require("fs");
const { request } = require("http");
//SET UP EXPRESS APP
const app = express(); //create an Express application
const port = process.env.PORT || "8888"; //set up a port number to run the application from

//Mongodb Client Setup

const dbUrl = "mongodb://localhost:27017/testdb";
const client = new MongoClient(dbUrl);

//SET UP EXPRESS APP TO USE PUG AS A TEMPLATE ENGINE
app.set("views", path.join(__dirname, "templates")); //set the "views" Express setting to the path to the folder containing the template files (conventionally, we name this "views" but you can name it whatever you want--for example, "templates")
app.set("view engine", "pug"); //set Express to use "pug" as the template engine (setting: "view engine")

//SET UP THE FOLDER PATH FOR STATIC FILES (e.g. CSS, client-side JS, image files)
app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//PAGE ROUTES
app.get("/", async (request, response) => {
    //response.status(200).send("Hello again!");
    // let test = {
    //   message: "Hello!"
    // };
    // response.json(test);
    let links = await getLinks();
    // console.log(links);
    response.render("index", { title: "Home", menu: links }); //renders /templates/layout.pug
});
app.get("/about", async (request, response) => {
    let links = await getLinks();
    response.render("about", { title: "About", menu: links });
});
// admin page paths

app.get("/admin/menu", async (request, response) => {
    let links = await getLinks();
    response.render("menu-list", { title: "administer menu", menu: links });
});

app.get("/admin/menu/add", async (request, response) => {
    let links = await getLinks();
    response.render("menu-add", { title: "Add menu link", menu: links });
});

app.post("/admin/menu/add/submit", async (request, response) => {
    // console.log(request.body);
    let newLink = {
        weight: parseInt(request.body.weight),
        path: request.body.path,
        name: request.body.name,
    };
    await addLink(newLink);
    response.redirect("/admin/menu");
});

app.get("/admin/menu/delete", async (request, response) => {
    let id = request.query.linkId;
    await deleteLink(id);
    response.redirect("/admin/menu");
});

app.get("/admin/menu/update/:id", async (request, response) => {
    db = await connection();
    let id = request.query.linkId;
    let link = await getLinkById(id);
    response.render("menu-edit", {
        title: "Update menu link",
        menu: link,
    });
});

app.post("/admin/menu/update/:id/submit", async (request, response) => {
    let id = request.query.linkId;
    let filter = { _id: new ObjectId(id) };
    let link = {
        weight: parseInt(request.body.weight),
        path: request.body.path,
        name: request.body.name,
    };
    await editLink(link, id);
    response.redirect("/admin/menu");
});

async function getLinkById(id) {
    db = await connection();
    return await db.collection("menuLinks").findOne({ _id: new ObjectId(id) });
}

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});

//Mongodb Function

async function connection() {
    try {
        await client.connect();
        db = client.db("testdb");
        return db;
    } catch (err) {
        console.error(err);
    }
}
async function getLinks() {
    db = await connection();
    let results = db.collection("menuLinks").find({});
    return await results.toArray();
}

async function addLink(linkToAdd) {
    db = await connection();
    await db.collection("menuLinks").insertOne(linkToAdd);
}

async function deleteLink(id) {
    db = await connection();
    let filter = { _id: new ObjectId(id) };
    let result = await db.collection("menuLinks").deleteOne(filter);
    if (result.deleteCount == 1) {
        console.log("link successfully deleted");
    }
}

async function editLink(link,id) {
    db = await connection();
    filter = { _id: new ObjectId(id) };
    await db.collection("menuLinks").updateOne(filter, {
        $set: {
            weight: link.weight,
            path: link.path,
            name: link.name,
        },
    });
}
