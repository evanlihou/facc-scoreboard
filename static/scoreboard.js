function emptyElement(elem) {
  while (elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }
}

var settings = {
  socketServer: document.getElementById('socketServer').value
};

var socket = io(settings.socketServer);

var scoreboard = {};

scoreboard.eventName = document.getElementById('eventName');
scoreboard.matchName = document.getElementById('matchName');

scoreboard.redInfo = document.getElementById('redScore');
scoreboard.blueInfo = document.getElementById('blueScore');

scoreboard.redInfo.redTeams = scoreboard.redInfo.getElementsByClassName(
  'teams'
)[0].children[0];
scoreboard.blueInfo.blueTeams = scoreboard.blueInfo.getElementsByClassName(
  'teams'
)[0].children[0];

// emptyElement(redTeams);

// var tmp = document.createElement('li');
// tmp.appendChild(document.createTextNode('Team 1'));
// redTeams.appendChild(tmp);
