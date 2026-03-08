<?php
use App\Models\User;
use Illuminate\Support\Facades\Hash;

$u = User::where('role', 'funcionario')->first();
$u->password = Hash::make('password');
$u->save();
echo 'Password reset to "password".';
