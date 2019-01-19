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
  startedAt: Date,
  redAlliance: allianceSchema,
  blueAlliance: allianceSchema
});

calculateScore = match => {
  let rsd = match.redAlliance.scoringDetails;
  let bsd = match.blueAlliance.scoringDetails;
  let rScore = 0;
  rScore += rsd.sandstorm.level1 * 3 + rsd.sandstorm.level2 * 6; // sandstorm
  rScore += rsd.hatchPanels * 2; // hatch panels
  rScore += rsd.cargo * 3; // cargo
  rScore +=
    rsd.habClimb.level1 * 3 +
    rsd.habClimb.level2 * 6 +
    rsd.habClimb.level3 * 12; // habclimb
  rScore += match.blueAlliance.fouls * 3 + match.blueAlliance.techFouls * 10;

  let bScore = 0;
  bScore += bsd.sandstorm.level1 * 3 + bsd.sandstorm.level2 * 6; // sandstorm
  bScore += bsd.hatchPanels * 2; // hatch panels
  bScore += bsd.cargo * 3; // cargo
  bScore +=
    bsd.habClimb.level1 * 3 +
    bsd.habClimb.level2 * 6 +
    bsd.habClimb.level3 * 12; // habclimb
  bScore += match.redAlliance.fouls * 3 + match.redAlliance.techFouls * 10;

  return { rScore, bScore };
};

// MODEL FOR DATABASE
var Match = mongoose.model('Match', matchSchema);

// var newMatch = new Match({
//   matchType: currentMatch ? currentMatch.matchType : '',
//   matchNumber: currentMatch ? currentMatch.matchNumber + 1 : 1,
//   matchStatus: 'pending',
//   redAlliance: {
//     teams: [],
//     scoringDetails: {
//       sandstorm: {
//         level1: null,
//         level2: null
//       },
//       hatchPanels: null,
//       cargo: null,
//       habClimb: {
//         level1: null,
//         level2: null,
//         level3: null
//       },
//       habDocking: null,
//       completeRocket: null
//     },
//     fouls: null,
//     techFouls: null,
//     totalPoints: null,
//     rankingPoints: null
//   },
//   blueAlliance: {
//     teams: [],
//     scoringDetails: {
//       sandstorm: {
//         level1: null,
//         level2: null
//       },
//       hatchPanels: null,
//       cargo: null,
//       habClimb: {
//         level1: null,
//         level2: null,
//         level3: null
//       },
//       habDocking: null,
//       completeRocket: null
//     },
//     fouls: null,
//     techFouls: null,
//     totalPoints: null,
//     rankingPoints: null
//   }
// });
// // SAVING MODEL
// newMatch.save(function(err, newMatch) {
//   if (err) return console.error(err);
//   io.emit('updateMatch', newMatch);
//   console.log('STARTED NEW MATCH');
//   currentMatch = newMatch;
//   console.log(currentMatch);
// });

// WEBSOCKETS
io.on('connection', function(socket) {
  // EMIT CURRENT GAME TO NEW CONNECTIONS
  console.log('A new user connected');
  io.emit('updateMatch', currentMatch);

  // NEW GAME TRIGGER WHEN ADMIN RESETS GAME
  socket.on('newMatch', function(msg) {
    var newMatch = new Match({
      matchType: currentMatch ? currentMatch.matchType : 'Qualification',
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
        techFouls: null,
        totalPoints: null,
        rankingPoints: null
      }
    });
    // SAVING MODEL
    newMatch.save(function(err, newMatch) {
      if (err) return console.error(err);
      io.emit('updateMatch', newMatch);
      console.log('STARTED NEW MATCH');
      currentMatch = newMatch;
    });
  });

  socket.on('updateMatch', async function(msg) {
    console.log('updateMatch');
    console.log(msg);
    var id = msg._id;
    delete msg._id;
    // console.log(msg);
    if (msg.setStart) {
      msg.startedAt = new Date(new Date().getTime() + 5000);
      delete msg.setStart;
    }
    await Match.findOneAndUpdate({ _id: id }, msg);
    match = await Match.findById(id);
    var { rScore, bScore } = calculateScore(match);
    console.log(rScore, bScore);
    match.redAlliance.totalPoints = rScore;
    match.blueAlliance.totalPoints = bScore;
    match.redAlliance.rankingPoints =
      match.redAlliance.completeRocket + match.redAlliance.habDocking || 0;
    match.blueAlliance.rankingPoints =
      match.blueAlliance.completeRocket + match.blueAlliance.habDocking || 0;
    match.save();
    io.emit('updateMatch', match);
    currentMatch = match;
    // console.log(match);
  });
});

app.set('port', process.env.PORT || 5000);

// ROUTING
// app.use('/static', express.static(__dirname + '/static'));
app.use('/', express.static(__dirname + '/facc-scoreboard-client/build'));
app.use('/admin', express.static(__dirname + '/facc-scoreboard-client/build'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/facc-scoreboard-client/build/index.html');
});

http.listen(process.env.PORT || 9000, function() {
  console.log(
    'Express server listening on port %d in %s mode',
    this.address().port,
    app.settings.env
  );
});
