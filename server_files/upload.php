<?php

$news_key = explode("_", basename($_FILES["file"]["name"]))[0]
$target_dir = "upload/".$news_key."/";
if (!file_exists("upload/".$news_key)) {
    mkdir("upload/".$news_key, 0777, true);
}
$target_file = $target_dir . basename($_FILES["file"]["name"]);
move_uploaded_file($_FILES["file"]["tmp_name"], "./demo/upload/".$news_key."/" . $_FILES["file"]["name"]);
echo "http://" . $_SERVER['SERVER_NAME'] . "/demo/upload/".$news_key."/" . $target_file;

?>

<?php
header('Access-Control-Allow-Origin: *');
$target_path = "upload/";
$target_path = $target_path . basename( $_FILES['file']['name']);
if (move_uploaded_file($_FILES['file']['tmp_name'], $target_path)) {
$response['code'] = '200';
$response['message'] = 'the file was uploaded successfuly';
echo json_encode($response);
} else {
		$response['code'] = '201';
		$response['error'] = 'there are missing arguments' ;
		echo json_encode($response);
}
?>

