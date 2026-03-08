<?php

use Illuminate\Http\Request;

$req = Request::create('/api/login', 'POST', ['login' => '0783394467', 'password' => 'password']);
$res = app()->handle($req);
echo $res->getContent();
