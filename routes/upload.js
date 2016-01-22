/*------------------------------------------------
  　ライブラリ，自己定義ファイル読み込み
-------------------------------------------------*/
var formidable = require('formidable');
var fs         = require('fs');
var async      = require('async');
var mysql      = require('mysql');
var settings   = require('../settings.js');
var easyimg    = require('easyimage');

/*------------------------------------------------
  各種定数
-------------------------------------------------*/
var mimeTypes = {
  "video/mpeg":".mp4",
  "image/jpeg":".jpg",
  "image/png":".png",
  "image/vnd.microsoft.icon":".ico",
  "video/mp4":".mp4",
};

/*------------------------------------------------
  画像・動画のアップロードを受け入れる
-------------------------------------------------*/
module.exports = function (req , res ) {

  console.dir(req.user);

  //フォーム関係変数
  var form   = new formidable.IncomingForm();
  var files  = [];
  var fields = [];

  //ファイルを保存、データベースに格納
  form.uploadDir = settings.PATH;
     var message;
     var latitude  = 0;
     var longitude = 0;
     var altitude  = 0;
     var file_path = "";
     form
         .on('field', function(field, value) {
           if(field == "message") {
             console.log("message: " + value)
             message = value;
           }

           if(field == "latitude") {
             console.log("latitude: " + value)
             latitude = value;
           }

           if(field == "altitude") {
             console.log("altitude: " + value)
             altitude = value;
           }

           if(field == "longitude") {
             console.log("longitude: " + value)
             longitude = value;
           }
           fields.push([field, value]);
         })
         .on('file', function(field, file) {
           fs.rename(file.path , file.path + mimeTypes[file.type] , function(err) {
             if(err) {
               fs.unlink(file.path + mimeTypes[file.type]);
               fs.rename(file.path , file.path + mimeTypes[file.type]);
              }
           });

           console.log(file.type);
           if ( file.type == "image/jpeg") {
             easyimg.resize({
                  src: file.path + mimeTypes[file.type],
                  dst: file.path + mimeTypes[file.type] +  ".thumb.jpg",
                  width:400
             }, function(err, image) {
                  if (err) throw err;
                  console.log('Resized ' + image.width + ' x ' + image.height);
             });
           }

           files.push([field, file]);
           file_path = file.path + mimeTypes[file.type];
         })
         .on('end', function() {
           //データベースに追加
           var post_data = {
             latitude : latitude ,
             longitude : longitude ,
             altitude : altitude ,
             message : message ,
             file_path : file_path,
             user_id  : req.user
           };

            insert_post(post_data);

            console.log('-> upload done');
            res.writeHead(200, {'content-type': 'text/plain'});
            res.write('data received');
            res.end();
         });
  form.parse(req);
};

/*------------------------------------------------
  プライベート関数：投稿内容をデータベースに追加
-------------------------------------------------*/
function insert_post(post_data) {
  var connection

  async.series([
    // コネクション確立
    function(callback) {
      connection = require('../helper/db_helper').connection();
      callback(null);
    },
    // クエリー文の生成・実行
    function(callback) {
      var place      = 'insert into Post set ?';
      var query      = connection.query(place, post_data, function(err, result){
        if(err != null) {
          console.log("感想投稿中，データの挿入に失敗しました。");
        } else {
          //データの挿入成功
        }
      });
      callback(null);
    }
  ]);
};
