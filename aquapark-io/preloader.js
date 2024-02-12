PROJECT.PRELOADER=new function()
{//здесь мы реализуем прелоадер
    var here=this;

    function init()
    {//инициализация. как правило не используем.
    }

    here.finish=function()
    {//конец загрузки прелоадера. как правило не используем.
    }

    here.show=function(app)
    {//загрузили ресурсы прелоадера и стартуем
        here.app=app;
        here.app.add_shadow(PROJECT.DAT.shadow);
        here.main=here.app.get_sprite("main");
        here.back=here.app.get_sprite("back");
        here.bar=here.app.get_sprite("bar");
        here.app.preloader_gfx.addChild(here.main);
        here.app.preloader_gfx.addChild(here.back);
        here.back.addChild(here.bar);
        here.main.y=PROJECT.DAT.height/2-here.main.avk.i_h;
        here.main.x=PROJECT.DAT.width/2-here.main.avk.i_w/2;
        here.back.x=20;
        here.back.y=1080;
        here.bar.sx=0.2;        
    }

    here.hide_bar=function()
    {
        here.bar.destroy();
        here.back.destroy();
        here.back=null;
        here.bar=null;
    }

    here.hide=function(on_hided)
    {//скрываем прелоадер
        here.app.preloader_gfx.removeChild(here.main);
        
        here.main.destroy();
        here.main=null;

        if (on_hided)
            on_hided();
    }

    here.set_progress=function(progress)
    {//передаем параметры прогресса
        if (here.bar)
            here.bar.sx=progress;
    }

    init();
}