<?php

use Randee\Menu\MenuManager;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

class RandeeMenuModule
{
    public static function getInstance(): MenuManager
    {
        return new MenuManager();
    }
}
