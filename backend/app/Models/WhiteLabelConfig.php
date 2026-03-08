<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class WhiteLabelConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'empresa_id',
        'systemName',
        'primaryColor',
        'logoUrl',
        'loginBgUrl'
    ];
}
