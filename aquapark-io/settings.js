PROJECT={};
PROJECT.GAME={};//объекты-файлы управления
PROJECT.PRT={};//прототипы
PROJECT.OBJ={};//объекты
PROJECT.WND={};//прототипы

PROJECT.DAT=new function()
{//информация проекта
    var here=this;

    here.product="aqua";
    here.version="0.1.0";
    here.platform="none";
    here.angle=75;
    here.width=640;//1024;//2048;//1080;
    here.height=1136;//768;//1536;//1920;
    here.color=0x84e0fb;//070b6c
    here.gui_images_cnt=1;
    here.snd_folder="https://cdn.jsdelivr.net/gh/google-classroom-work/respons@main/data/snd/";
    here.gfx_folder="https://cdn.jsdelivr.net/gh/google-classroom-work/respons@main/data/pics/";
    here.gfx_gui_folder="https://cdn.jsdelivr.net/gh/google-classroom-work/respons@main/data/gui/pics/";
    here.preloader=["bar","back","main"];
    here.object="https://cdn.jsdelivr.net/gh/google-classroom-work/respons@main/data/sector";
    here.fbx_folder="https://cdn.jsdelivr.net/gh/google-classroom-work/respons@main/data/";
    here.fbx_objects=["woman","man","pig","fox"];
    here.font="https://cdn.jsdelivr.net/gh/google-classroom-work/respons@main/data/fnt.json";
    here.shadow="shadow";
    here.assets = {};
    here.sounds = ["click","fail","win","knock","col","nil"];
    
    for(var i=0;i<here.gui_images_cnt;i++)
        here.assets["images_"+i]="https://cdn.jsdelivr.net/gh/google-classroom-work/respons@main/data/gui/images_"+i+".json";
}