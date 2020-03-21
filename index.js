require('dotenv').config();
const Discord = require('discord.js');
fs = require('fs');

const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const GOLDMASTER_ID = process.env.GOLDMASTER_ID;
const INITIAL_TOKENS = process.env.INITIAL_TOKENS;
const emojiAnswers = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣'];


var state = false;
var quiz;
var quizChannel;
var StartTime;

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
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

        //SEND TITLE:

        console.log("START");
        new Promise(function (resolve, reject) {
          setTimeout(function () {
            resolve('foo');
          }, 5000)
        }).then(result => {
          console.log(result);
          //GAME START:
          //QUESTIONS :
          var i = 1;
          var previsouTime = 0;
          //Sending Questions :
          while (quiz.content[i] != null) {
            new Promise(function (resolve, reject) {
              var tempI = i;
              setTimeout(function () {
                console.log("tempI " + tempI);
                resolve(quiz.content[tempI]);
              }, (quiz.content[tempI].temps + previsouTime) * 1000)
            }).then(qObject => {
              //Send question message :
              var qMessage = '> **Question ' + qObject.numero + '**\n> ' + qObject.question;
              var j = 1;
              while (qObject.reponses[j] != null) {
                qMessage = qMessage + "\n>     - " + qObject.reponses[j];
                j++;
              }
              msg.channel.send(qMessage).then(qMsgSent => {
                var k = 1;
                while (qObject.reponses[k] != null) {
                  qMsgSent.react(emojiAnswers[k - 1]);
                  k++;
                }
              }).catch(err => {
                console.log(err);
               });  
            });
            previsouTime = previsouTime + quiz.content[i].temps;
            i++;
          }
        })
      }
    }
  }
});