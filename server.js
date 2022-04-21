require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const bodyParser = require('body-parser');
const router = express.Router;
const mongoose = require('mongoose');


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.use(bodyParser.urlencoded({"extended": "false"}));
app.use(bodyParser.json());

// log middleware
postLog = (req, res, next) => {
  console.group("POST" + req.path + "; Body" + JSON.stringify(req.body));
  next();
};

getLog = (req, res, next) => {
  console.group("GET" + req.path + "; Params" + JSON.stringify(req.params));
  next();
};

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// db interface
// connect via URI
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

// create DB schema
const { Schema } = mongoose;

const urlSchema = new Schema({
  original_url : { type: String, required: true },
  short_url : { type: Number, required: true }
});

// init model
let Url = mongoose.model('Url', urlSchema);

const saveUrl = (urlObject, done) => {
  console.log("func: " + saveUrl.name + "; args: " + JSON.stringify(urlObject));
  let newUrl = new Url(urlObject);
  newUrl.save((error, data) => {
    if (error) return console.error(error);
    done(null, data._id);
  });
};

const findMaxShortUrl = (done) => {
  Url
    .find({})
    .sort("-short_url")
    .limit(1)
    .select("short_url")
    .exec((err, data) => {
      if (err) return done(err);
      done(null, data[0].short_url);
    });
};

const updateShortUrl = (id, done) => {
  console.log("func: " + updateShortUrl.name + "; args: " + id);
  
  findMaxShortUrl((search_err, max_val) => {
    if (search_err) return console.error(search_err);
    
    let options = {
      new: true,
      select: "-_id original_url short_url"
    }
    
    Url.findByIdAndUpdate(
      id, 
      {short_url: max_val + 1}, 
      options, 
      (err, data) => {
        if (err) return console.error(err);
        done(null, data)
    });
  });
};

// url shortener API
app.post("/api/shorturl", postLog, (req, res) => {
  checkUrl(req.body.url, (err, url_data) => {
    if (err) return res.json({error: 'Invalid URL'});
    
    Url.find(
      {original_url: url_data.original_url}, 
      "-_id original_url short_url", 
      (search_err, query) => {
        if (search_err) return console.error(search_err);
        
        if (query.length == 0) {
          saveUrl(url_data, (url_err, newUrlId) => {
            if (url_err) return console.error(url_err);
            
            updateShortUrl(
              newUrlId, 
              (update_err, updatedRecord) => {
                if (update_err) return console.error(update_err);
                res.json(updatedRecord);
            });
          });
        } else {
          res.json(query[0]);
        };
    });
  });
});

// redirect
app.get("/api/shorturl/:urlnum", getLog, (req, res) => {
  if (/\d+/.test(req.params.urlnum)) {
    Url
      .findOne({"short_url": req.params.urlnum})
      .exec((err, query) => {
        if (err) return console.error(err);
        res.redirect(query.original_url);
      });
  } else {
    res.json({ error: "Wrong format"});
  };
});

// check if url is valid
const BAD_URL_PROTOCOL = new Error("Invalid url protocol!");

let checkUrl = (url_str, done) => {
  console.log("func: " + checkUrl.name + "; args: " + url_str)
  try {
    let url = new URL(url_str);

    if (/https{0,1}:/.test(url.protocol)) {
      dns.lookup(
        url.host, 
        (err, add, fam) => {
          if (err) return done(err);
          done(null, { original_url: url_str, short_url: 0 });
      });
    } else {
      throw BAD_URL_PROTOCOL;
    };    
  } catch (e) {
    return done(e);
  };
};

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
