/*********************************************************************
 * РОБОНЯШЬ с управлением по Bluetooth
 * Платформа: Iskra JS
 * Управляющее приложение: Arduino BT Joystick (Android)
 *
 * Подключенные модули: Bluetooth модуль HC-06 - пин: 0, 1
 *                      Светодиод - пин: 2
 *                      Пьезо-пищалка - пин: 3
 *                      Motor Shield - пин: 4, 5, 6, 7
 *                      Аналоговый датчик линии (не используется) - Левый: А0, Правый: А1
 *                      Цифровой датчик линии (не используется)- Левый: 10, Правый: 9
 *                      Сервопривод - пин: 8
 *                      Ультразвуковой дальномер (не используется) - пин: 12, 13
 *
 * Управление (код кнопки): Ничего не нажато(0) - Стоит
 *                          Стрелка вверх(1)    - Едет вперед
 *                          Стрелка вниз(2)     - Едет назад
 *                          Стрелака влево(3)   - Поворачивает налево
 *                          Стрелка вправо(4)   - Поворачивает направо
 *                          Кнопка Select(5)    - (не используется)
 *                          Кнопка Start(6)     - (не используется)
 *                          Кнопка Треугольник(7) - Вращается вправо
 *                          Кнопка Квадрат(8)     - Вращается влево
 *                          Кнопка Крестик(9)     - (не используется)
 *                          Кнопка Кружок(А)      - Стрельба
 *
 *********************************************************************/

var robonyash_bt = require('@amperka/robot-2wd').connect();
var neck = require('@amperka/servo').connect(P8);
var laser_led = require('@amperka/led').connect(P2);
var shoot_sound = require('@amperka/buzzer').connect(P3);

var buffer = '';
var speed = 0.5; //скорость движения

neck.write(70); //выравнивание головы
Serial3.setup(115200); //скорость соединения по bluetooth

Serial3.on('data', function(data)
{
  buffer += data;
  var lines = buffer.split('#');
  buffer = lines[lines.length - 1];
  for(l = 0; l < lines.length - 1; l++)
  {
    On_Data(lines[l]);
  }
});

var On_Data = function(data) 
{
  switch (data[2])
  {
    case '0': //Стоит (Ничего не нажато)
      robonyash_bt.go({l: 0, r: 0});
      shoot_sound.turnOff();
      laser_led.turnOff();
      break;
    case '1': //Вперед (Стрелка вверх)
      robonyash_bt.go({l: speed, r: speed});
      break;
    case '2': //Назад (Стрелка вниз)
      robonyash_bt.go({l: -speed, r: -speed});
      break;
    case '3': //Налево (Стрелка влево)
      robonyash_bt.go({l: speed - 0.3, r: speed});
      break;
    case '4': //Направо (Стрелка вправо)
      robonyash_bt.go({l: speed, r: speed - 0.3});
      break;
    case '5': //не используется (Select)
      break;
    case '6': //не используется (Start)
      break;
    case '7': //Вращается вправо (Треугольник)
      robonyash_bt.go({l: speed, r: -speed});
      break;
    case '8': //Вращается влево (Квадрат)
      robonyash_bt.go({l: -speed, r: speed});
      break;
    case '9': //не используется (Крестик)
      break;
    case 'A': //Стрельба (Кружок)
      shoot_sound.toggle();
      laser_led.toggle();
      break;
  }
  print(data[2]); //Вывод пришедшей по бт команды в консоль
};



/*******ДЛЯ ОТЛАДКИ BLUETOOTH МОДУЛЯ*****
*
* Закоментировать основную программу и
* раскоментировать одну из функций.
* Проверочная команда Serial3.print('AT');
* другие АТ команды в гугле.
* Первая точно работает!
* Вторую надо бы доделать!
*
* Основые команды:
* Serial3.print('AT+NAMEArduinoCar-bt'); - Задать имя ArduinoCar-bt
* Serial3.print('AT+BAUD8'); - Установить скрость 115200 (9600 по умолчанию)
****************************************/

/*Serial3.setup(9600);
Serial3.on('data', function(data){
  print(data);
});
P3.write(1);*/

/*Serial3.setup(115200);
var buffer = '';
Serial3.on('data', function(data){
  buffer += data;
  var lines = buffer.split('\r\n');
  buffer = lines[lines.length - 1];
  if(lines.length > 1){
    for(l = 0; l < lines.length - 1; l++){
      print(lines[l]);
    }
  }
});
P3.write(1);*/
