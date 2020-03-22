const Discord = require('discord.js');
fs = require('fs');

const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const GOLDMASTER_ID = process.env.GOLDMASTER_ID;
const emojiAnswers = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣'];

var state = false;
var quiz;
var answserTime = false;

var listOfPlayersWhoAnswered = [];
var currentQuestionNumber = 0;
var questionMsgId;
var scores = {};
//console.log(array1.sort(function(a,b){if (a.s < b.s) return -1; else if (a.s > b.s) return 1}));

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('messageReactionAdd', (reaction, user) => {
  if (state && emojiAnswers.includes(reaction.emoji.name) && user.id !== bot.user.id
    && reaction.message.id == questionMsgId) {
    if (!listOfPlayersWhoAnswered.includes(user.tag) && answserTime) {
      //check answer :
      var correctAnswer = quiz.content[currentQuestionNumber].result;
      if (emojiAnswers.indexOf(reaction.emoji.name) + 1 == correctAnswer) {
        if (scores[user.tag] == null) scores[user.tag] = 0;
        scores[user.tag] = scores[user.tag] + Math.max((1000 - 25 * listOfPlayersWhoAnswered.length), 500);
      }
      listOfPlayersWhoAnswered.push(user.tag);
      console.log(scores);
    }
    //const userReactions = reaction.cache.filter(reaction => reaction.users.cache.has(user.id));
    reaction.users.remove(user.id);
    //reaction.message.delete();
  }
});

bot.on('message', msg => {
  //GAME MASTER
  if (msg.author.id == GOLDMASTER_ID) {
    //GIVE X BALANCE
    if (msg.content.startsWith("!play") && msg.content.split(' ').length == 2) {
      if (!state) {
        //init
        state = true;
        scores = {};
        questionMsgId = null;
        currentQuestionNumber = 0;
        quiz = JSON.parse(fs.readFileSync(msg.content.split(' ')[1] + '.json', 'utf8'));
        //QUESTIONS :
        var i = 1;
        var previousTime = 0;
        var previousQuestionTime = 10; //timer before first question

        //SEND TITLE:
        msg.channel.send("**LE Quiz '"+ quiz.title + "' VA COMMENCER DANS " + previousQuestionTime + "SECONDES !**");
        console.log("**LE Quiz '"+ quiz.title + "' VA COMMENCER DANS " + previousQuestionTime + "SECONDES !**");
        //GAME START:

        //Sending Questions :
        while (quiz.content[i] != null) {
          new Promise(function (resolve, reject) {
            var tempI = i;
            setTimeout(function () {
              //Display Question after previous ended
              currentQuestionNumber = tempI;
              answserTime = true;
              listOfPlayersWhoAnswered = [];
              displayQuestion(quiz.content[tempI], msg.channel);
            }, (previousQuestionTime + previousTime + (i-1)*10) * 1000);
            previousTime = previousTime + previousQuestionTime;
            previousQuestionTime = quiz.content[i].temps;
            setTimeout(function () {
              //Display Question after previous ended
              answserTime = false;
              displayScore(msg.channel);
            }, (previousQuestionTime + previousTime + (i-1)*10) * 1000);
          });
          i++;
        }
        setTimeout(function () {
          //END of Game
          state = false;
          msg.channel.send("**Fin du Quiz !**");
        }, (previousQuestionTime + previousTime + (i-1)*10) * 1000);
      }
    }
  }
});

function displayScore(channel){
    //Send question message :
    var qMessage = '> **SCORES : **';
    var j = 1;
    for(var userTag in scores) {
      qMessage = qMessage + "\n> - " + userTag + " : " +scores[userTag];
    }
    channel.send(qMessage);
}

function displayQuestion(qObject, channel) {
  //Send question message :
  var qMessage = '> **Question ' + qObject.numero + '**\n> ' + qObject.question;
  var j = 1;
  while (qObject.reponses[j] != null) {
    qMessage = qMessage + "\n>     - " + qObject.reponses[j];
    j++;
  }
  channel.send(qMessage).then(qMsgSent => {
    questionMsgId = qMsgSent.id;
    var k = 1;
    while (qObject.reponses[k] != null) {
      qMsgSent.react(emojiAnswers[k - 1]);
      k++;
    }
    setTimeout(function () {
      var qEditMessage = '> **Question ' + qObject.numero + '**\n> ' + qObject.question; 
      j = 1;
      while (qObject.reponses[j] != null) {
        if (j != qObject.result) qEditMessage = qEditMessage + "\n>     ❌ " + qObject.reponses[j];
        else qEditMessage = qEditMessage + "\n>     :white_check_mark: " + qObject.reponses[j];
        j++;
      }
      qMsgSent.edit(qEditMessage);
    }, qObject.temps * 1000);
  }).catch(err => {
    console.log(err);
  });
}