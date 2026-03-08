<?php

use App\Models\User;
use App\Models\FuncionarioDetalhe;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;

$u = User::where('email', 'akio@mail.com')->first();
$u->password = Hash::make('password');
$u->save();

$req = Request::create('/api/login', 'POST', ['login' => '0783394467', 'password' => 'password']);
$res = app()->handle($req);
echo $res->getContent();
