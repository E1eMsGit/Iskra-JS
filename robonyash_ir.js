/*********************************************************************
 * Робоняшь с управлением по ИК пульту
 * Платформа: Iskra JS
 * Управляющее устройство: Пульт ДУ
 *
 * Подключенные модули: ИК-приемник - пин: P1
 *                      Светодиод - пин: P2
 *                      Motor Shield - пин: P4, P5, P6, P7
 *                      Аналоговый датчик линии - Левый: А0, Правый: А1
 *                      Цифровой датчик линии (не используется) - Левый: P10, Правый: P9
 *                      Сервопривод - пин: P8
 *                      Ультразвуковой дальномер - пин: trig: P12, echo: P11
 *
 * Робоняшь управляется стрелками на пульте ДУ. Режимы выбираются цифрами,
 * отключить выполнение какого либо режима - "0"
 *
 * Режимы:
 *    Прилипала - Если расстояние до руки больше допустимого, робот едет вперёд. Если меньше —
 *                едет назад. Если расстояние в заданных пределах — робот просто стоит.
 *
 *    Сумоист - Выталкивает предметы за пределы стола. Подойдут алюминиевые банки,
 *              картонные коробки — любые небьющиеся предметы.
 *
 *              Функция Detect_Border опрашивает датчики линии и проверяет, не приблизился
 *              ли робот к краю стола. Если это произошло, робот начнёт двигаться назад, чтобы не
 *              упасть. При этом переменной caution будет присвоено значение true.
 *
 *              УЗ-дальномер измеряет расстояние до предметов. Если оно оказывается меньше
 *              max_distance, робот едет в сторону предмета, пытаясь его столкнуть. Если робот
 *              оказывается у края стола, переменная caution будет равна true. В этом случае команда
 *              движения вперёд не сработает.
 *              Если расстояние до руки больше допустимого, робот едет вперёд. Если меньше —
 *              едет назад. Если расстояние в заданных пределах — робот просто стоит.
 *
 *    Охранник - Робот-охранник поворотом головы осматривает территорию. Если видит нарушителя
 *               границы, включает прожектор и едет на задержание.
 *
 * Управление: Стрелка вверх    - Едет вперед
 *             Стрелка вниз     - Едет назад
 *             Стрелака влево   - Едет поворачивая налево
 *             Стрелка вправо   - Едет поворачивая направо
 *             Кнопка "ОК"      - Останавливается
 *             Кнопка "1"       - Режим "Прилипала"
 *             Кнопка "2"       - Режим "Сумоист"
 *             Кнопка "3"       - Режим "Охранник"
 *             Кнопка "0"       - Отключить выполнение какого либо режима или установка средней скорости для ручного управления
 *             Кнопка "#"       - Увеличить скорость
 *             Кнопка "*"       - Уменьшить скорость
 *
 *
 *********************************************************************/

var robonyash = require('@amperka/robot-2wd').connect();
var receiver = require('@amperka/ir-receiver').connect(P1);
var led = require('@amperka/led').connect(P2);
var eyes = require('@amperka/ultrasonic').connect({
  trigPin: P12,
  echoPin: P11
});
var neck = require('@amperka/servo').connect(P8);
var hands = require('@amperka/analog-line-sensor');
var left_hand = hands.connect(A0);
var right_hand = hands.connect(A1);

// Коды с кнопок пульта.
var UP = 0x3fd8a77;
var DOWN = 0x3fea15f;
var LEFT = 0x3fc8b77;
var RIGHT = 0x3ff08f7;
var OK = 0x3fc0bf7;
var ONE = 0x3fda25f;
var TWO = 0x3fe619f;
var THREE = 0x3fec13f;
var ZERO = 0x3fd2ad7;
var SHARP = 0x3fd4ab7;
var STAR = 0x3fd0af7;


// Для управления скоростью в ручном режиме.
var speed = 0.5;

// Для Прилипалы.
var DISTANCE_MIN = 10;
var DISTANCE_MAX = 14;
var STICKER_SPEED = 0.5;

// Для Сумоиста.
var FORWARD = 0.5;
var BACKWARD = 0.8;
var ROTATE = 0.2;
var BORDER_VALUE = 0.5;
var SUMO_MAX_DISTANCE = 30;
var save = false;

// Для Охранника.
var STEP = 5;
var GUARD_MAX_DISTANCE = 30;
var GUARD_SPEED = 0.5;
var angle = 90;

// Хранит номер интервальной функции setInterval().
// По этому номеру можно отключить выполнение функции setInterval()
var interval_id;

// Голова смотрит по центру.
neck.write(angle);

// Функция управления скоростью в ручном режиме.
function speed_control(operation) {
  if (operation === "+") {
    if (speed > 1) {
      speed = 1;
    } else {
      speed += 0.1;
    }
  }
  else if (operation === "-") {
    if (speed < 0.3) {
      speed = 0.3;
    } else {
      speed -= 0.1;
    }
  }
}

// Функции для Прилипалы.
function sticker() {
  eyes.ping(function(error, value) {
    if (!error) {
      sticker_check(value);
    }
  }, 'cm');
}

function sticker_check(distance) {
  if (distance > DISTANCE_MAX) {
    robonyash.go({l: STICKER_SPEED, r: STICKER_SPEED});
  } else if (distance < DISTANCE_MIN) {
    robonyash.go({l: -STICKER_SPEED, r: -STICKER_SPEED});
  } else {
    robonyash.stop();
  }
}

// Функции для Сумоиста.
function sumoist() {
  eyes.ping(function(error, value) {
    if (!error && value < SUMO_MAX_DISTANCE) {
      if (!save) {
        robonyash.go({l: FORWARD, r: FORWARD});
      }
    } else {
      robonyash.go({l: ROTATE, r: -ROTATE});
    }
  }, 'cm');
}

function sumoist_detect_border() {
  if (left_hand.read() < BORDER_VALUE) {
    save = true;
    robonyash.go({l: 0, r: -BACKWARD});
  } else if (right_hand.read() < BORDER_VALUE) {
    save = true;
    robonyash.go({l: -BACKWARD, r: 0});
  } else {
    save = false;
  }
}

// Функции для Охранника.
function guard() {
  eyes.ping(function(error, value) {
    if (!error && value < GUARD_MAX_DISTANCE) {
      led.turnOn();
      robonyash.go({l: GUARD_SPEED, r: GUARD_SPEED});
    } else {
      led.turnOff();
      robonyash.stop();

      if (angle <= 55 || angle >= 135) {
        STEP = -STEP;
      }
      angle = angle + STEP;
      neck.write(angle);
    }
  }, 'cm');
}

// Обработка приема сигналов с пульта.
receiver.on('receive', function(code) {
  // Если режим не выбран.
  if (!interval_id) {
    // Вперед.
    if (code === UP) {
      robonyash.go({l: speed, r: speed});
    }
    // Назад.
    if (code === DOWN) {
      robonyash.go({l: -speed, r: -speed});
    }
    // Влево.
    if (code === LEFT) {
      robonyash.go({l: speed - 0.3, r: speed});
    }
    // Вправо.
    if (code === RIGHT) {
      robonyash.go({l: speed, r: speed - 0.3});
    }
    // Стоп.
    if (code === OK) {
      robonyash.stop();
    }
    // Режим "Прилипала".
    if (code === ONE) {
      interval_id = setInterval(sticker, 100);
    }
    // Режим "Сумоист".
    if (code === TWO) {
      interval_id = setInterval(sumoist_detect_border, 10);
      interval_id = setInterval(sumoist, 100);
    }
    // Режим "Охранник".
    if (code === THREE) {
      interval_id = setInterval(guard, 100);
    }
    // Уменьшить скорость.
    if (code === STAR) {
      speed_control("-");
    }
    // Увеличить скорость.
    if (code === SHARP) {
      speed_control("+");
    }
    // Средняя скорость.
    if (code === ZERO) {
      speed = 0.5;
    }
  }
  // Отключить выполнение какого либо режима.
  else if (code === ZERO) {
    robonyash.stop();
    led.turnOff();
    angle = 90;
    neck.write(angle);
    interval_id = clearInterval(interval_id);
  }
  console.log('0x' + code.toString(16));
});