const Discord = require('discord.js');
fs = require('fs');

const bot = new Discord.Client();
//const TOKEN = process.env.TOKEN;
//const GOLDMASTER_ID = process.env.GOLDMASTER_ID;
const TOKEN = "NDAzOTE1NDU4NTI2NDQ1NTc4.XoEQ6g.HfmT5YI5a2TrF423XEP0zPzwt88";
const GOLDMASTER_ID = "202846457030508544";
const emojiAnswers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];

var state = false;
var quiz;
var answserTime = false;

var listOfPlayersWhoAnswered = [];
var listOfPlayersWhoAnsweredRight = [];
var currentQuestionNumber = 0;
var questionMsgId;
var scores = {};

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
        scores[user.tag] = scores[user.tag] + Math.max((40 - 1 * listOfPlayersWhoAnsweredRight.length), 20);
        listOfPlayersWhoAnsweredRight.push(user.tag);
      }
      listOfPlayersWhoAnswered.push(user.tag);
    }
    //const userReactions = reaction.cache.filter(reaction => reaction.users.cache.has(user.id));
    //reaction.users.remove(user.id);
    //reaction.message.delete();
  }
});

bot.on('message', msg => {
  //GAME MASTER
  if (msg.author.id == GOLDMASTER_ID) {
    //GIVE X BALANCE
    if (msg.content.startsWith("!play") && msg.content.split(' ').length == 2) {
      if (!state) {
        try {
          const quizFile = fs.readFileSync(msg.content.split(' ')[1] + '.json', 'utf8');
          //init
          state = true;
          scores = {};
          questionMsgId = null;
          currentQuestionNumber = 0;
          quiz = JSON.parse(quizFile);
          //QUESTIONS :
          var i = 1;
          var previousTime = 0;
          var previousQuestionTime = 10; //timer before first question
          var pauseTime = quiz.pauses;

          //SEND TITLE:
          msg.channel.send("**Le Quiz '" + quiz.title + "' va commencer dans " + previousQuestionTime + " secondes !**"
            + "\n*Attention : les réactions(réponses) avant que les questions ne s'affichent entièrement ne sont pas comptabilisées.*");
          //GAME START:

          //Sending Questions :
          while (quiz.content[i] != null) {
            new Promise(function (resolve, reject) {
              var tempI = i;
              setTimeout(function () {
                //Display Question 
                currentQuestionNumber = tempI;
                listOfPlayersWhoAnswered = [];
                listOfPlayersWhoAnsweredRight = [];
                displayQuestion(quiz.content[tempI], msg.channel);
              }, ((previousQuestionTime + previousTime + (i - 1) * pauseTime) - 5) * 1000);
              previousTime = previousTime + previousQuestionTime;
              previousQuestionTime = quiz.content[i].temps;
              setTimeout(function () {
                //Display Scores
                answserTime = false;
                displayScore(msg.channel);
              }, (previousQuestionTime + previousTime + (i - 1) * pauseTime) * 1000);
            });
            i++;
          }
          setTimeout(function () {
            //END of Game
            state = false;
            msg.channel.send("**Fin du Quiz !**");
            displayFullScores(msg.channel);
          }, (previousQuestionTime + previousTime + (i - 1) * pauseTime) * 1000);
        }
        catch (exception) {
          console.log(exception);
        }
      }
    }
  }
});

function displayFullScores(channel) {
  var sortable = [];

  for (var player in scores) {
    sortable.push([player, scores[player]]);
  }
  sortable.sort(function (a, b) {
    return b[1] - a[1];
  });
  //sending full scores :
  channel.send('> **Tableau des scores : **');
  var sMessages = [];
  //Send question message :
  var qMessage = "";
  var countLines = 0;
  for (var userRank in sortable) {
    var rank = parseInt(userRank) + 1;
    if (rank != 1) qMessage = qMessage + "> #" + rank + " " + sortable[userRank][0] + " : " + sortable[userRank][1] + "\n";
    else qMessage = qMessage + "> **#" + rank + " " + sortable[userRank][0] + " : " + sortable[userRank][1] + " :crown:**\n";
    countLines++;
    if (countLines == 25) {
      sMessages.push(qMessage);
      countLines = 0;
      qMessage = "";
    }
  }
  if (countLines != 0) sMessages.push(qMessage);
  for (msg in sMessages) {
    channel.send(sMessages[msg]);
  }
}

function displayScore(channel) {
  var sortable = [];
  for (var player in scores) {
    sortable.push([player, scores[player]]);
  }
  sortable.sort(function (a, b) {
    return b[1] - a[1];
  });
  //Send question message :
  var qMessage = '> **TOP 10 / ' + sortable.length + ' : **';
  for (var userRank in sortable) {
    var rank = parseInt(userRank) + 1;
    if (rank == 11) break;
    if (rank != 1) qMessage = qMessage + "\n> #" + rank + " " + sortable[userRank][0] + " : " + sortable[userRank][1];
    else qMessage = qMessage + "\n> **#" + rank + " " + sortable[userRank][0] + " : " + sortable[userRank][1] + " :crown:**";
  }
  channel.send(qMessage);
}

function displayQuestion(qObject, channel) {
  //Send question message :
  var qMessage = '> **Question ' + qObject.numero + "| Durée : " + qObject.temps + 's**\n> ' + qObject.question;
  var j = 1;
  while (qObject.reponses[j] != null) {
    qMessage = qMessage + "\n>     " + emojiAnswers[j - 1] + " " + qObject.reponses[j];
    j++;
  }
  channel.send('> **Question ' + qObject.numero + " dans 5 secondes !**\n> **Durée : " + qObject.temps + "s**")
    .then(qMsgSent => {
      questionMsgId = qMsgSent.id;
      if (!qObject.troll) {
        var k = 1;
        while (k != 10 && qObject.reponses[k] != null) {
          qMsgSent.react(emojiAnswers[k - 1]);
          k++;
        }
      } else {
        var k = 9;
        while (k != 0) {
          if (qObject.reponses[k] != null) qMsgSent.react(emojiAnswers[k - 1]);
          k--;
        }
      }
      //display Question after 5s.
      setTimeout(function () {
        answserTime = true;
        qMsgSent.edit(qMessage);
      }, 5 * 1000);
      setTimeout(function () {
        var qEditMessage = '> **Question ' + qObject.numero + '**\n> ' + qObject.question;
        j = 1;
        while (qObject.reponses[j] != null) {
          if (j != qObject.result) qEditMessage = qEditMessage + "\n>     ❌ " + qObject.reponses[j];
          else qEditMessage = qEditMessage + "\n>     :white_check_mark: " + qObject.reponses[j];
          j++;
        }
        qMsgSent.edit(qEditMessage);
      }, (qObject.temps + 5) * 1000);
    }).catch(err => {
      console.log(err);
    });
}