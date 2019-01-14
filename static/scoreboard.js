function emptyElement(elem) {
  while (elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }
}

var socket = io('http://localhost');

var eventName = document.getElementById('eventName');
var matchName = document.getElementById('matchName');

var redInfo = document.getElementById('redScore');
var blueInfo = document.getElementById('blueScore');

var redTeams = redInfo.getElementsByClassName('teams')[0].children[0];
var blueTeams = blueInfo.getElementsByClassName('teams')[0].children[0];

emptyElement(redTeams);

var tmp = document.createElement('li');
tmp.appendChild(document.createTextNode('Team 1'));
redTeams.appendChild(tmp);
