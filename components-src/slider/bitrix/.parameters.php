<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

$arComponentParameters = [
    'PARAMETERS' => [
        'TITLE' => [
            'PARENT' => 'BASE',
            'NAME' => 'Title',
            'TYPE' => 'STRING',
            'DEFAULT' => 'Randee Slider',
        ],
        'SUBTITLE' => [
            'PARENT' => 'BASE',
            'NAME' => 'Subtitle',
            'TYPE' => 'STRING',
            'DEFAULT' => 'Preview your component in Studio',
        ],
    ],
];

