/*********************************************************************
 * Нян телеграм-бот
 * Платформа: Iskra JS
 * Управляющее приложение: Telegram
 *
 * Подключенные модули: Модуль Wi-Fi - пин: 0, 1
 *                      Датчик температуры - пин: A1
 *                      Датчик освещённости - пин: А4
 *
 * Управление: /start - Создает и выводит на экран клавиатуру.
 *             /Measurements - Выводит на экран показания с датчиков.
 *             /Game - Активирует игру "Угадай число".
 *
 *********************************************************************/

const WiFi_SSID = '';
const WiFi_PASSWORD = '';
const TELEGRAM_TOKEN = '';

var answer; // Загаданное число.
var user_answer; // Ответ пользователя.

var light = require('@amperka/light-sensor').connect(A4);
var temperature = require('@amperka/thermometer').connect(A1);

var bot = require('@amperka/telegram').create({
  token: TELEGRAM_TOKEN ,
  polling: { timeout: 10 }
});

var wifi = require('@amperka/wifi').setup(function(err) {
  if (err) print(err);
  setTimeout(()=>{
    wifi.init(function(err) {
      if (err) print(err);
      wifi.connect(WiFi_SSID, WiFi_PASSWORD, function(err) {
        if (err) print(err);
        print('I\'m ready!');
        bot.connect();
      });
    });
  }, 2000);
});

bot.on('/start', function(msg) {
  let keyboard = bot.keyboard([['/Measurements', '/Game']], { resize: true });
  bot.sendMessage(msg.from.id, 'Hello! Please choose an action', { markup: keyboard });
});

bot.on('/Measurements', function(msg) {
  light_mes = "Room lighting: " + light.read('lx').toFixed(2) + " lux.\n";
  temp_mes = "Room temperature: " + temperature.read('C').toFixed(2) + " degree celsius.";
  bot.sendMessage(msg.from.id, light_mes + temp_mes);
});

bot.on('/Game', function(msg) {
  bot.sendMessage(msg.from.id, 'Welcome to Guess the Number!\n'
                  + 'Try to guess the number (0 - 99).');
  answer = parseInt(Math.random() * 100);
  console.log('Right answer:', answer);

  bot.on('text', function(msg) {
    user_answer = msg.text;
    user_answer = parseInt(user_answer);
    if (user_answer > answer) {
      bot.sendMessage(msg.from.id, 'Your number is too big.');
    } else if (user_answer < answer) {
      bot.sendMessage(msg.from.id, 'Your number is too small.');
    } else if (user_answer == answer) {
      bot.sendMessage(msg.from.id, 'Congratulations!\n'
                      + 'input /Game to restart.');
    }
  });
});
