PROJECT.MAIN=function()
{//после чтения всего кода js мы вызываем этот конструктор
    var here=this;

    function start_game()
    {//реальный старт игры
        PROJECT.GAME.MAIN.before_show();
        PROJECT.PRELOADER.hide(PROJECT.GAME.MAIN.start_game);//скрываем прелоадер и стартуем игру
        
    }

    function on_loaded()
    {//начинаем работу после загрузки всех ассетов
        PROJECT.GAME.MAIN=new PROJECT.PRT.MAIN(here.app);//создаем все объекты игры
        PROJECT.STR.init(start_game);
    }

    if (WEBGL.isWebGLAvailable())
    {
        here.app=PROJECT.APP=new PROJECT.APP(on_loaded);//считываем ассеты
    }else
    {
        var warning = WEBGL.getWebGLErrorMessage();
        document.body.appendChild(warning);
    }
}