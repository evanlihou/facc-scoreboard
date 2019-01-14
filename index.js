var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
const env = require('./env');
var currentMatch;

// DATABASE CONNECTION - MONGODB
mongoose.connect(
  'mongodb://' +
    env.mongo_user +
    ':' +
    env.mongo_password +
    '@' +
    env.mongo_server +
    '/' +
    env.mongo_db,
  { useNewUrlParser: true }
);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("You're connected to MongoDB!");
});

// SCHEMA FOR DATABASE
var allianceSchema = mongoose.Schema({
  teams: [String],
  scoringDetails: {
    sandstorm: {
      level1: Number,
      level2: Number
    },
    hatchPanels: Number,
    cargo: Number,
    habClimb: {
      level1: Number,
      level2: Number,
      level3: Number
    },
    habDocking: Boolean,
    completeRocket: Boolean
  },
  fouls: Number,
  techFouls: Number,
  totalPoints: Number,
  rankingPoints: Number
});

var matchSchema = mongoose.Schema({
  eventName: String,
  matchType: String,
  matchNumber: Number,
  matchStatus: String,
  redAlliance: allianceSchema,
  blueAlliance: allianceSchema
});

// MODEL FOR DATABASE
var Match = mongoose.model('Match', matchSchema);

// WEBSOCKETS
io.on('connection', function(socket) {
  // EMIT CURRENT GAME TO NEW CONNECTIONS
  console.log('A new user connected');
  io.emit('getCurrentMatch', currentMatch);

  // NEW GAME TRIGGER WHEN ADMIN RESETS GAME
  socket.on('newMatch', function(msg) {
    var newMatch = new Match({
      matchType: currentMatch ? currentMatch.matchType : '',
      matchNumber: currentMatch ? currentMatch.matchNumber + 1 : 1,
      matchStatus: 'pending',
      redAlliance: {
        teams: [],
        scoringDetails: {
          sandstorm: {
            level1: null,
            level2: null
          },
          hatchPanels: null,
          cargo: null,
          habClimb: {
            level1: null,
            level2: null,
            level3: null
          },
          habDocking: null,
          completeRocket: null
        },
        fouls: null,
        techFouls: null,
        totalPoints: null,
        rankingPoints: null
      },
      blueAlliance: {
        teams: [],
        scoringDetails: {
          sandstorm: {
            level1: null,
            level2: null
          },
          hatchPanels: null,
          cargo: null,
          habClimb: {
            level1: null,
            level2: null,
            level3: null
          },
          habDocking: null,
          completeRocket: null
        },
        fouls: null,
        techFould: null,
        totalPoints: null,
        rankingPoints: null
      }
    });
    // SAVING MODEL
    newMatch.save(function(err, newMatch) {
      if (err) return console.error(err);
      io.emit('newMatch', newMatch);
      console.log('STARTED NEW MATCH');
      currentMatch = newMatch;
      console.log(currentMatch);
    });
  });

  socket.on('updateMatch', function(msg) {
    console.log('updateMatch');
    var id = msg.id;
    delete msg.id;
    Match.findByIdAndUpdate(id, msg);
    Match.findById(id, function(err, match) {
      io.emit('updateMatch', found);
    });
  });
});

app.set('port', process.env.PORT || 5000);

// ROUTING
app.use('/static', express.static(__dirname + '/static'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/static/index.html');
});

// app.get('/scoreboard', function(req, res) {
//   res.sendFile(__dirname + '/build/scoreboard.html');
// });

// app.get('/admin', function(req, res) {
//   res.sendFile(__dirname + '/build/admin.html');
// });

http.listen(process.env.PORT || 3000, function() {
  console.log(
    'Express server listening on port %d in %s mode',
    this.address().port,
    app.settings.env
  );
});
