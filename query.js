'use strict'
var mysql = require('mysql');

class Query{
	/**
	*
	*/
	constructor(connectionPool){
	/**
	* Конструктор
	* connectionPool - пул соединений к БД
	*/
		this.connectionPool = connectionPool;

		//Список допустимых типов запросов
		this.queryTypeList = new Set();
		this.queryTypeList.add('insert')
		                  .add('select')
		                  .add('update')
		                  .add('delete');
	}

	static create(connectionPool){
	/**
	* Создание экземпляра класса
	* connectionPool - пул соединений к БД
	*/
		return new Query(connectionPool);
	}

	type(type){
	/**
	* type - тип запроса (select, insert, update, delete)
	*/
		//Проверяем допустимость переданного типа запроса
		if(!this.queryTypeList.has(type)) throw new Error('Invalid query type');

		this.queryType = type;

		return this;
	}

	table(queryTable){
	/**
	* Из какой таблицы делаем запрос
	*/
		this.queryTable = queryTable;

		return this;
	}

	field(fieldName){
	/**
	* Какие поля необходимо вернуть
	*/
		if(!fieldName) return this;

		this.fields = [];

		//Преобразовываем псевдомассив arguments в обычный массив
		let args = [];
		for (let i = 0; i < arguments.length; i++) {
			if(Array.isArray(arguments[i])){ // если агрунмет - массив значение
				args = args.concat(arguments[i]); // то конкатенируем его
			} else {
				args[i] = arguments[i];
			}
		}

		this.fields = args;

		return this;
	}

	value(value){
	/**
	* список значений VALUES для INSERT
	* value - значение, список значений (множество агрументов) или массив
	*/

		//если value не передано, то ничего не делаем
		if(!value) return this;

		//определяем/обнуляем массив values в объекте
		this.values = [];

		//Преобразовываем псевдомассив arguments в обычный массив
		let args = [];
		for (let i = 0; i < arguments.length; i++) {
			if(Array.isArray(arguments[i])){ // если агрунмет - массив значение
				args = args.concat(arguments[i]); // то конкатенируем его
			} else {
				args[i] = arguments[i];
			}
		}

		this.values = args;

		return this;

	}

	set(field, value){
	/**
	* создание пары поле-значение для секции SET оператора UPDATE
	* field - имя поля таблицы
	* value - значение
	*/
		if(!this.sets) this.sets = [];


		this.sets.push([field, value]);

		return this;

	}

	predicate(field, value, condition){
	/**
	* Создание предиката
	* field - имя поля таблицы
	* value - значение
	* condition - условие сравнения ('=', '>', '<', '>=')
	*/
		if(!this.predicates) this.predicates = [];
		
		if(!condition) condition = '=';

		this.predicates.push([field, value, condition]);

		return this;
	}

	clearPredicate(){
	/**
	* Очистить массив предикатов
	*/
		if(this.predicates) this.predicates = [];

		return this;
	}

	insert(){
	/**
	* Конструируем insert
	*/
		let sql = '';

		//INSERT INTO
		sql = `insert into ${this.queryTable} `;

		if(this.fields){
			sql += `(${this.fields.join(',')})`;
		}

		//VALUES
		if(!this.values) return false;
		
		sql += ' values ';
		//Экранируем значения
		let escape = [];
		for (var i = 0; i < this.values.length; i++) {
			escape[i] = mysql.escape(this.values[i]);
		};

		sql += `(${escape.join(',')})`
		
		// console.log('sql insert: ', sql);
		
		return sql;
	}

	select(){
	/**
	* Конструируем select
	*/
		//SELECT
		let sql = 'select ';

		if (!this.fields || this.fields.length === 0){
			sql += ' * ';
		} else{
			sql += this.fields.join(',');
		}

		//FROM
		sql += ` from ${this.queryTable} `;

		//WHERE
		sql += ' where 1=1 ';

		sql += this.predicateRender();

		// console.log('sql select: ', sql);

		return sql;
	}

	update(){
	/**
	* Конструируем update
	*/
		//UPDATE
		let sql = 'update ';

		sql += `${this.queryTable} `;

		//SET
		sql +=	'set ';

		//Экранируем значения
		let escape = [];
		for (var i = 0; i < this.sets.length; i++) {
			escape[i] = `${mysql.escapeId(this.sets[i][0])} = ${mysql.escape(this.sets[i][1])}`;
		};

		sql += escape.join(',');

		//WHERE
		sql += ' where 1=1 ';

		sql += this.predicateRender();

		// console.log('sql update: ', sql);

		return sql;
	}

	delete(){
	/**
	* Конструируем delete
	*/
		//DELETE
		let sql = 'delete from ';

		sql += `${this.queryTable} `;

		//WHERE
		sql += ' where 1=1 ';

		sql += this.predicateRender();

		// console.log('sql delete: ', sql);

		return sql;
	}

	predicateRender(){
	/**
	* Преобразовываем массив предикатов в строку для запроса
	*/
		let sql = '';

		if(!this.predicates) return sql;

		for (var i = 0; i < this.predicates.length; i++) {
			sql += ` and ${mysql.escapeId(this.predicates[i][0])} ${this.predicates[i][2]} ${mysql.escape(this.predicates[i][1])} `;
		};

		return sql;

	}

	exec(callback){
	/**
	* Исполнение запроса
	* callback - функция обратного вызова
	*/
		
		//получаем текст запроса
		let sql = this[this.queryType]();
		
		console.log('SQL exec: ', sql);
		
		if(!callback){ // callback по умолчанию
			var callback = function(err, result){console.log('err: ', err, 'result: ', result)};
		}
		
		// Получаем соединение с БД из пула
		this.connectionPool.getConnection((err, connection) => {
			if(err){ // если не получилось то возвращаем ошибку
				callback(err, null);
				// connection.release() тут наверное не нужен, т.к. соединения мы не получили (???)
				return
			}

			//Делаем запрос
			connection.query(sql, (err, result, fields) => {
				callback(err, result, fields); // вызываем наш callback
				// connection.release(); // возвращаем соединение обратно в пул
				connection.destroy(); // или убиваем соединение
			});
		});

		// Очищавем параметры запроса
		this.fields = [];
		this.values = [];
		this.sets = [];
		this.predicates = [];

		return this;
	}
}

module.exports.query = Query;

