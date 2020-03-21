require('dotenv').config();
const Discord = require('discord.js');
fs = require('fs');

const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const GOLDMASTER_ID = process.env.GOLDMASTER_ID;
const emojiAnswers = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣'];


var state = false;
var quiz;
var quizChannel;
var StartTime;

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
    if (!listOfPlayersWhoAnswered.includes(user.tag)) {
      //check answer :
      var correctAnswer = quiz.content[currentQuestionNumber].result;
      if (emojiAnswers.indexOf(reaction.emoji.name) + 1 == correctAnswer) {
        if (scores[user.tag] == null) scores[user.tag] = 0;
        scores[user.tag] = scores[user.tag] + Math.max((1000 - 25 * listOfPlayersWhoAnswered.length), 500);
      }
      listOfPlayersWhoAnswered.push(user.tag);
      console.log(scores);
    }
  }
});

bot.on('message', msg => {
  console.log(msg.content);
  //GAME MASTER
  if (msg.author.id == GOLDMASTER_ID) {
    //GIVE X BALANCE
    if (msg.content.startsWith("!play") && msg.content.split(' ').length == 2) {
      if (!state) {
        state = true;
        quiz = JSON.parse(fs.readFileSync(msg.content.split(' ')[1] + '.json', 'utf8'));
        quizChannel = msg.channel;
        StartTime = Date.now();
        currentQuestionNumber = 0;
        //QUESTIONS :
        var i = 1;
        var previousTime = 0;
        var previousQuestionTime = 10; //timer before first question

        //SEND TITLE:
        channel.send("**LE Quiz '"+ quiz.title + "' VA COMMENCER DANS " + previousQuestionTime + "SECONDES !**");
        console.log("**LE Quiz '"+ quiz.title + "' VA COMMENCER DANS " + previousQuestionTime + "SECONDES !**");
        //GAME START:

        //Sending Questions :
        while (quiz.content[i] != null) {
          new Promise(function (resolve, reject) {
            var tempI = i;
            setTimeout(function () {
              //Display Question after previous ended
              currentQuestionNumber = tempI;
              listOfPlayersWhoAnswered = [];
              displayQuestion(quiz.content[tempI], msg.channel);

              resolve(quiz.content[tempI]);
            }, (previousQuestionTime + previousTime) * 1000)
          });
          previousTime = previousTime + previousQuestionTime;
          previousQuestionTime = quiz.content[i].temps
          i++;
        }
      }
    }
  }
});

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
  }).catch(err => {
    console.log(err);
  });
}