'use strict'
var mysql = require('mysql');
var configDB = require('./db/config.js').config;
var query = require('./query.js').query;

var pool = mysql.createPool(configDB);

var q = query.create(pool);

q.type('insert') // тип sql-запроса
 .table('Users') // таблица для запроса
 .value(10, 'MagrateyaMan', 'Slartibartfast', '') // список значений для insert-а
 .exec((err, result)=>{ // запуск запроса, результаты передаются в callback
 	console.log('row inserted', err);
 	
 	q.type('select')  // тип sql-запроса
 	 .field('first_name', 'last_name') // какие поля вытащить из таблицы
 	 .exec((err, result)=>{ // запуск запроса, результаты передаются в callback
 	 	selectToConsole(result);
 		
 		q.type('update')  // тип sql-запроса
 		 .set('last_name', 'Thought') // пара поле-значение для update
 		 .set('first_name', 'Deep') // пара поле-значение для update
 		 .set('username', 'SuperComputer') // пара поле-значение для update
 		 .predicate('userid', 10) // условие для where
 		 .exec((err, result)=>{ // запуск запроса, результаты передаются в callback
 			console.log('row updated');
 			
 			q.type('select')  // тип sql-запроса
 			 .exec((err, result)=>{ // запуск запроса, результаты передаются в callback
 			 	selectToConsole(result);

 			 	q.type('delete')  // тип sql-запроса
 			 	 .predicate('userid', 10) // условие для where
 			 	 .exec((err, result) =>{ // запуск запроса, результаты передаются в callback
 			 	 	console.log('rows deleted');

 			 	 	q.type('select') // тип sql-запроса
 			 	 	 .field('username') // какие поля вытащить из таблицы
 			 	 	 .exec((err, result) =>{ // запуск запроса, результаты передаются в callback)
 			 	 	 	selectToConsole(result);
 			 	 	 });
 			 	 });
 			 });
 		 });
 	 });
 });


function selectToConsole(rows){
/**
* Показать в консоли результат select-а в удобочитаемом виде
*/	
	if(!rows[0]) console.log('0 ROWS');

	let width = 13; // ширина столбца

	let str = '';

	for(let key in rows[0]){
		let temp = key;
		
		if(temp.length >= width) {
			temp = temp.substr(0, width-4) + '... ';
		} else{
			temp += ' '.repeat(width - temp.length);
		}

		str += temp;
	}

	console.log(str); // шапка
	console.log('-'.repeat(str.length)); // разделитель между шапкой и данными

	for (var i = 0; i < rows.length; i++) {
		let str = '';
		for(let key in rows[i]){
			let temp = rows[i][key].toString();
			if(temp.length >= width) {
				temp = temp.substr(0, width-4) + '... ';
			} else{
				temp += ' '.repeat(width - temp.length);
			}

			str += temp;
		}
		console.log(str); // строка 
	};
}