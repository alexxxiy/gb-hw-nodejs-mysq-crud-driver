/*
создаем новую базу данных
*/
CREATE DATABASE my_db CHARACTER SET utf8;

USE my_db;

/*
Пользователи
*/
CREATE TABLE Users(
    userid         INT UNSIGNED NOT NULL AUTO_INCREMENT
  , username       VARCHAR(255) UNIQUE NOT NULL
  , first_name     VARCHAR(255)
  , last_name      VARCHAR(255)
  , PRIMARY KEY (userid)
);

INSERT Users (userid, username, first_name, last_name) 
SELECT 1, 'Monkey', 'Arthur', 'Dent'
UNION 
SELECT 2, 'Trilian', 'Tricia', 'McMillan'
UNION 
SELECT 3, 'President', 'Zaphod', 'Beeblebrox'
UNION 
SELECT 4, 'Marvin', 'Android', 'Paranoid'
UNION 
SELECT 5, 'BetelgeuseMan', 'Ford', 'Prefect';
