PROJECT.PRT.MAIN=function(app)
{//главный экран
    var here=this;
    var current_level=1;
    var win_level_cnt=0;
    var run=false;
    var UP_UP_SPEED=24;//скорость всплытия
    var DOWN_UP_SPEED=20;//скорость падения
    var UP_SPEED_START=32;//скорость горизонтальная прыжка
    var UP_SPEED_FIN=6;//скорость горизонтальная прыжка
    var CAMERA_SPEED=3;//скорость поворота камеры вбок
    var UP_GORKA=24;//ускорение выброса
    var UP_A=5;//ускорение выброса
    var FLY_SPEED=40;//скорость полета горизонтальная
    var DOWN_SPEED=6;//скорость падения
    var ROT_SPEED=1.2;//скорость вращения в полете
    
    var BODY_SPEED=14*0.7*PROJECT.STR.SPEED;//скорость спуска по горке
    var MAX_BODY_SPEED_TAP=BODY_SPEED*PROJECT.STR.HIT_SPEED;//скорость спуска по горке
    var MIN_STOP_SPEED=BODY_SPEED*PROJECT.STR.HIT_DECREASE_SPEED;//скорость спуска по горке
    var BONUS_BODY_SPEED=BODY_SPEED*PROJECT.STR.BONUS_SPEED;//добавка скорости от бонуса
    var BONUS_TK=PROJECT.STR.BONUS_TIME;//добавка скорости
    var SPEED_UP=5*0.85*PROJECT.STR.SPEED_RECOVERY_SPEED;//скорость прироста скорости спуска по горке
    var SPEED_UP_DELTA=SPEED_UP*PROJECT.STR.SPEED_RECOVERY_SPEED_PENALTY;//пнальти
    var MIN_BODY_SPEED=PROJECT.STR.HIT_BLOCK_SPEED;//скорость после удара о блок

    var DELTA_SPEED=2.4;//скорость вращения в трубе
    var P_PREP=0.04;//вероятность препятствия
    var P_FONTAN=0.02;//вероятность фонтана
    var OUT_BARIER=0.0;//барьер вылета
    var CHANGE_TK=350;//время изменений
    var DL_R=8;
    var DL_H=8;
    var NO_WATER_SPEED=PROJECT.STR.NO_WATER_SPEED;
    here.app=app;

    var finished=false;
    here.is_down=false;
    here.mouse_x=0;
    here.mouse_y=0;
    here.blocks=[];
    here.swipe_dx=0;
    here.sum_tk=0;

    var QUIET=PROJECT.STR.QUIET_TIME;
    here.quiet_tk=QUIET;
    here.fontan=[];

    here.hint_action=null;
    here.hint_num=PROJECT.STR.hints_count;

    here.begin_level_complete=false;//начало отработано уже и ждем догрузку уровня
    here.quaternion = new THREE.Quaternion();
    here.vector = new THREE.Vector3(0,1,0);
            
    here.rand=214013;
    here.random=function()
    {//реализация рандома
        var n1 = 214013;
        var n2 = 2531011;
        here.rand = (here.rand * n1 + n2)>>32;
        
        var r=(((here.rand) & 0x7fffffff) % 10000)/10000;
        if (r>1)
            r=0;
        return r;//Math.random();
    }

    /*
    Обработка событий
    */

    function on_swipe(dx,dy)
    {
        if ((!run)||(dx==0))
            return;

        here.quiet_tk=QUIET;
        here.swipe_dx=dx/PROJECT.DAT.width*DELTA_SPEED*1.6;
    }

    function on_down(obj,x,y)
    {
        if (!here.snd)
        {
            here.snd=true;
            here.app.sounds.nil.play();
        }

        if (!run)
        {
            return;
        }

        here.is_down=true;
        here.mouse_x=x;
        here.mouse_y=y;
    }

    function on_up(obj,x,y)
    {
        here.is_down=false;
    }

    function on_move(obj,x,y)
    {
        if (here.is_down)
        {
            on_swipe(x-here.mouse_x,y-here.mouse_y);

            here.mouse_x=x;
            here.mouse_y=y;
        }
    }

    function onDown(data)
    {
        window.console.log(data.keyCode);
        if(here.msg)
            return;
        switch (data.keyCode)
        {
            case 37://left
            case 65://A
                if (run)
                {
                    here.player.key_dr=1;
                    here.quiet_tk=QUIET;
                }
                
                data.stopPropagation();
                data.preventDefault();
                break;
            case 39://right
            case 68://D
                if (run)
                {
                    here.player.key_dr=-1;
                    here.quiet_tk=QUIET;
                }
                
                data.stopPropagation();
                data.preventDefault();
                break;
        }         
    }

    function onUp(data)
    {
        switch (data.keyCode)
        {
            case 37://left
            case 65://A
                if(here.msg)
                    return;
                here.player.key_dr=0;
                data.stopPropagation();
                data.preventDefault();
                break;
            case 39://right
            case 68://D
                if(here.msg)
                    return;
                here.player.key_dr=0;
                data.stopPropagation();
                data.preventDefault();
                break;
            case 13://Enter
                if ((here.msg)&&(here.msg.btn_replay)&&(here.msg.btn_replay.visible)&&(here.app.busy==0))
                    here.msg.btn_replay.avk.on_click();
                break;
        }
    }

    /*
    Обработка событий закончена
    */

    here.on_resize=function()
    {//постоянно вызывается на апдэйт
        if(here.msg)
        {
            if (here.msg.name_place)
            {
                here.htxt.style.left=Math.floor(here.app.dx*here.app.scale+here.msg.name_place.x*here.app.scale)+'px';
                here.htxt.style.top=Math.floor(here.app.dy*here.app.scale+here.msg.name_place.y*here.app.scale)+'px';
                here.htxt.style.width=Math.floor(here.app.scale*here.msg.name_place.p_w)+'px';
                here.htxt.style.height=Math.floor(here.app.scale*here.msg.name_place.p_h)+'px';
                here.htxt.style["font-size"]=Math.floor(here.msg.name_place.p_h*here.app.scale*0.75)+"px";
            }
        }
    }    

    here.get_person=function(info)
	{//возвращаем персону
		var obj=here.app.get_fbx(info.name);
        obj.material.body_mat.color.r=info.body[0];
        obj.material.body_mat.color.g=info.body[1];
        obj.material.body_mat.color.b=info.body[2];
        obj.material.pants_mat.color.r=info.pants[0];
        obj.material.pants_mat.color.g=info.pants[1];
        obj.material.pants_mat.color.b=info.pants[2];
        obj.material.hair_mat.color.r=info.hair[0];
        obj.material.hair_mat.color.g=info.hair[1];
        obj.material.hair_mat.color.b=info.hair[2];

        obj.korona=here.app.get_object("korona");
        obj.add(obj.korona);
        obj.korona.position.y=0.5;
        obj.korona.position.z=-0.5;
        obj.korona.rotation.x=-Math.PI/2;
        obj.korona.material.side=THREE.DoubleSide;
        obj.korona.visible=false;

        obj.zvezda=here.app.get_object("zvezda");
        obj.add(obj.zvezda);
        obj.zvezda.y=1;
        obj.zvezda.visible=false;

        return obj;
    }
    
    function init_pereson_object(obj,place,name)
    {//инициализация человека
        if (name=="")
            name=" ";
        obj.nm=name;

        obj.back=new THREE.Group();
        obj.back.renderOrder=1;
        here.main_scene.add(obj.back);

        obj.dead=here.app.get_sprite("main_dead",true);
        obj.dead.children[0].material.depthTest=true;
        obj.dead.children[0].material.sizeAttenuation=true;
        obj.dead.children[0].center.y=0.1;
        obj.dead.children[0].center.x=0.5;
        obj.dead.children[0].scale.set(obj.dead.avk.i_rw/obj.dead.avk.i_rh*0.5,0.5,1);
        obj.dead.visible=false;
        obj.dead.renderOrder=2;
        obj.back.add(obj.dead);

        obj.txt=here.app.get_text(name,32,"#5B5F6F");
        obj.txt.children[0].center.y=1.1;
        obj.txt_place=here.app.get_text(""+place,28,"#5B5F6F");
        obj.txt.material.depthTest=true;
        obj.txt_place.material.depthTest=true;
        obj.txt.scale.set(0.015,0.015,0.015);
        obj.txt_place.scale.set(0.015,0.015,0.015);
        obj.back.add(obj.txt);
        obj.back.add(obj.txt_place);
        obj.pl=place;
        here.main_scene.add(obj);
        
        obj.set_place=function(pl)
        {
            if (this.pl!=pl)
            {
                this.pl=pl;
                if (pl<-1)
                {
                    this.txt_place.visible=false;
                    this.dead.visible=true;
                }else if (pl<0)
                {
                    this.txt_place.visible=true;
                    this.dead.visible=false;
                    this.txt_place.text="#";
                    this.txt_place.children[0].center.y=0.6;
                }else
                {
                    this.txt_place.visible=true;
                    this.dead.visible=false;
                    this.txt_place.text="# "+pl;
                    this.txt_place.children[0].center.y=0.6;
                }
            }
        }

        obj.set_name=function(name)
        {
            if (name=="")
                name=" ";
            this.nm=name;
            this.txt.text=name;
            this.txt.children[0].center.y=1.1;
        }
    }

    function load_current_level()
    {//загружаем файл декораций
        function on_loaded_level(level)
        {
            here.main_scene.add(level);
            if ((here.msg)&&(here.msg.wait)&&(here.begin_level_complete))
            {
                here.msg.btn_replay.visible=here.msg.btn_skin.visible=true;
                here.msg.wait.visible=false;
            }
        }
        here.load_level("data/level"+current_level+"/level",on_loaded_level);
    }

    function save()
    {
        var dat={money:here.money,player_byed:here.player_byed,player_id:here.player_id,select_id:here.select_id,name:PROJECT.STR.player,current_level:current_level,win_level_cnt:win_level_cnt};
        PROJECT.STR.save(dat);
    }

    function load_game_progress()
    {//загружаем прогресс игрока
        var dat=PROJECT.STR.load();
        
        if (dat)
        {
            here.money=dat.money*1;
            here.player_byed=dat.player_byed*1;
            here.player_id=dat.player_id*1;
            here.select_id=dat.select_id*1;
            PROJECT.STR.player=dat.name;
            if (typeof(dat.current_level)!="undefined")
                current_level=dat.current_level*1;
            else current_level=1;

            if (typeof(dat.win_level_cnt)!="undefined")
                win_level_cnt=dat.win_level_cnt*1;
            else win_level_cnt=0;
        }else
        {
            PROJECT.STR.player=PROJECT.STR.get(200);
            here.money=0;
            here.player_byed=0;
            here.player_id=0;
            here.select_id=0;
            current_level=1;
            win_level_cnt=0;
        }
        PROJECT.STR.heroes[0]=PROJECT.STR.players[here.player_id];
    }

    here.before_show=function()
    {//начало игры перед тем, как закроем прелоадер
        load_game_progress();
        var texture=here.app.loader.load(PROJECT.DAT.gfx_folder+"soon.png"+here.app.ver,here.app.on_texture_loaded);
        texture.generateMipmaps = false;
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        
        for (var i=1;i<=PROJECT.STR.max_level();i++)
        {
            var texture=here.app.loader.load(PROJECT.DAT.gfx_folder+"level_ico_"+i+".png"+here.app.ver,here.app.on_texture_loaded);
            texture.generateMipmaps = false;
            texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.minFilter = THREE.LinearFilter;
        }

        here.wnd=PROJECT.OBJ.MAIN=here.app.show(PROJECT.WND.MAIN);
        here.app.on_resize_functions.push(here.on_resize);

        here.wnd.bar.children[0].material.map.magFilter=THREE.NearestFilter;
        here.wnd.bar.children[0].material.map.minFilter=THREE.NearestFilter;
        here.set_progress(-1);
        //Поле ввода имени игрока
        here.htxt=document.createElement('INPUT');
        here.htxt.autofocus=true;
        here.htxt.type="text";
        here.htxt.class="flat";
        here.htxt.onblur="this.className='flat'";
        here.htxt.style["z-index"]=1;
        here.htxt.style["font-family"]="PT Sans Caption";
        here.htxt.style["position"]="absolute";
        here.htxt.style["border"]="2px";
        here.htxt.maxLength=20;
        here.htxt.value=PROJECT.STR.player;
        here.htxt.select();
        here.htxt.style.display="none";
        document.body.appendChild(here.htxt);

        here.wnd.dead.free();
        here.wnd.person_back.free();

        here.wnd.back.interactive=true;
        here.wnd.back.x=-4*here.wnd.back.p_h;
        here.wnd.back.y=-4*here.wnd.back.p_h;
        here.wnd.back.sx=here.wnd.back.sy=20;
        here.wnd.back.avk.on_down=on_down;
        here.wnd.back.avk.on_up=on_up;
        here.wnd.back.avk.on_move=on_move;

        //свет
        var light = new THREE.AmbientLight(0xffffff,1.1); // soft white light
        here.app.scene_3d.add(light);
        light.position.set(0,100,-20);

        var directionalLight = new THREE.DirectionalLight(0xffffff,0.7);
        directionalLight.position.set(2000,1500,-2000);
        directionalLight.target.position.set(1800,0,-1800);
        here.app.scene_3d.add(directionalLight);

        //постоянные объекты сцены
        here.game_scene=new THREE.Group();
        here.app.app_gfx.add(here.game_scene);
        here.main_scene=new THREE.Group();
        here.game_scene.add(here.main_scene);
        here.player_scene=new THREE.Group();
        here.game_scene.add(here.player_scene);

        here.select_scene=new THREE.Group();
        here.game_scene.add(here.select_scene);
        here.select_scene.visible=false;
        
        here.app.on_update_functions.push(update);        

        here.bonus=here.app.get_object("bonus");
        here.geo=here.app.get_object("geo");
        here.gorka=here.app.get_object("gorka");

        here.main_scene.add(here.geo);
        here.main_scene.add(here.bonus);
        here.main_scene.add(here.gorka);

        here.bonus.visible=false;
        here.bonus.play=function(){};//это чтобы мы типа анимации проигрывали
        
        //боты
        here.bots=[];
        for (var i=1;i<16;i++)
        {
            var bot=here.get_person(PROJECT.STR.heroes[i]);
            bot.is_player=false;
            bot.bot_id=i;
            init_pereson_object(bot,i,"bot_name");
            here.bots.push(bot);
        }

        //юзер
        here.select=[];
        for (var i=0;i<PROJECT.STR.players.length;i++)
        {
            var bot=here.get_person(PROJECT.STR.players[i]);
            bot.play("swim");
            here.select.push(bot);
            here.select_scene.add(bot);

            bot.player=here.get_person(PROJECT.STR.players[i]);
            bot.player.is_player=true;
            bot.player.bot_id=0;
            init_pereson_object(bot.player,0,"bot_name");
            
            here.player_scene.add(bot.player);
            here.player_scene.add(bot.player.back);
            bot.player.visible=false;
            bot.player.back.visible=false;
        }

        here.player=here.select[here.player_id].player;
        here.bots.unshift(here.player);
        here.player.visible=true;
        here.player.back.visible=true;
    }

    function init_level_continue()
    {//продолжаем после загрузки имен
        function add_prep(x,y,z,a,block)
        {
            if (here.flag)
                return;

            here.flag=true;
            
            var id=Math.floor(here.random()*3);
            if (!block.prep)
                block.prep=[null,null,null];

            block.prep[0]=null;
            block.prep[1]=null;
            block.prep[2]=null;

            if (here.random()>0.3)
            {
                var prep=here.app.get_object("prep_"+id);
                here.main_scene.add(prep);
                prep.position.set(x,y,z);
                prep.rotation.y=a;
                block.prep[id]=prep;
            }else
            {
                switch (id) 
                {
                    case 0:
                        var prep=here.app.get_object("prep_0");
                        here.main_scene.add(prep);
                        prep.position.set(x,y,z);
                        prep.rotation.y=a;
                        block.prep[0]=prep;
                        var prep=here.app.get_object("prep_1");
                        here.main_scene.add(prep);
                        prep.position.set(x,y,z);
                        prep.rotation.y=a;
                        block.prep[1]=prep;
                        break;
                    case 1:
                        var prep=here.app.get_object("prep_0");
                        here.main_scene.add(prep);
                        prep.position.set(x,y,z);
                        prep.rotation.y=a;
                        block.prep[0]=prep;
                        var prep=here.app.get_object("prep_2");
                        here.main_scene.add(prep);
                        prep.position.set(x,y,z);
                        prep.rotation.y=a;
                        block.prep[2]=prep;
                        break;
                    case 2:
                        var prep=here.app.get_object("prep_1");
                        here.main_scene.add(prep);
                        prep.position.set(x,y,z);
                        prep.rotation.y=a;
                        block.prep[1]=prep;
                        var prep=here.app.get_object("prep_2");
                        here.main_scene.add(prep);
                        prep.position.set(x,y,z);
                        prep.rotation.y=a;
                        block.prep[2]=prep;
                        break;
                }
            }
            
        }

        function add_fontan(x,y,z,a,block)
        {
            if (here.flag_f)
                return;

            here.flag_f=true;
            block.prep=[null,null,null];

            var prep=here.app.get_object("fontan");
            here.main_scene.add(prep);
            prep.position.set(x,y,z);
            prep.rotation.y=a;
            block.fontan=prep;
            here.fontan.push(prep);
        }

        while (here.fontan.length>0)
            here.fontan.pop();//просто удаляем чтобы не апдэйтить. освободим объект позже

        while (here.blocks.length>0)
        {//чистим блоки, фонтаны, препятствия
            var block=here.blocks.pop();
            if(block.prep)
            {
                if (block.prep[0])
                {
                    block.prep[0].free();
                    block.prep[0]=null;
                }
                if (block.prep[1])
                {
                    block.prep[1].free();
                    block.prep[1]=null;
                }
                if (block.prep[2])
                {
                    block.prep[2].free();
                    block.prep[2]=null;
                }
            }

            if(block.fontan)
            {
                block.fontan.free();
                block.fontan=null;
            }

            block.free();
        }

        var x=0;//here.gorka.position.x;
        var y=2.30651;//2.02854;
        var z=27.0536;//25.6015;
        var a=0;
        var f=true;
        var prev_id=1;

        here.level_info=PROJECT.STR.levels[current_level-1];//[{cnt:20,len:50,nums:[214013]
        P_PREP=here.level_info.p_prep;
        P_FONTAN=here.level_info.p_fontan;
        var LEVEL_LEN=here.level_info.len;
        var id=Math.floor(Math.random()*here.level_info.tube_colors.length);
        var first_mat=here.level_info.tube_colors[id][0];
        var second_mat=here.level_info.tube_colors[id][1];

        here.gorka.material.color.r=first_mat[0];
        here.gorka.material.color.g=first_mat[1];
        here.gorka.material.color.b=first_mat[2];
        here.game_scene.visible=true;

        here.rand=here.level_info.nums[Math.floor(Math.random()*here.level_info.nums.length)];

        for (var i=0;i<LEVEL_LEN;i++)
        {
            var id=Math.floor(here.random()*3);
            if ((id!=0)&&(prev_id!=id))
            {
                if (here.random()>0.75)
                    id=prev_id;
                else prev_id=id;
            }

            var m=4+Math.floor(here.random()*8);
            if (i==0)
            {
                id=0;
                m=10;
            }
            if (i==LEVEL_LEN-1)
            {
                id=0;
                m=20;
            }

            here.flag=false;
            here.flag_f=false;

            for (var n=0;n<m;n++)
            {
                switch (id) 
                {
                    case 0://pram
                        var block=here.app.get_object("pram");
                        block.position.set(x,y,z);
                        block.rotation.y=Math.PI*a/180;
                        block.avk_a=Math.PI*a/180;
                        block.avk_x=x;
                        block.avk_y=y;
                        block.avk_z=z;
                        
                        if ((i<LEVEL_LEN-10)&&(here.random()>1-P_PREP))
                            add_prep(x,y,z,Math.PI*a/180,block);       
                        else if ((i<LEVEL_LEN-10)&&(here.random()>1-P_FONTAN))
                            add_fontan(x,y,z,Math.PI*a/180,block);

                        x+=3.5*Math.sin(Math.PI*a/180);// 2.98427*Math.sin(Math.PI*a/180);
                        y+=0.3;
                        z+=3.5*Math.cos(Math.PI*a/180);
                        break;
                    case 1://ugol_r
                        var block=here.app.get_object("ugol_r");
                        block.position.set(x,y,z);
                        block.rotation.y=Math.PI*a/180;
                        block.avk_a=Math.PI*a/180;
                        block.avk_x=x;
                        block.avk_y=y;
                        block.avk_z=z;

                        if ((i<LEVEL_LEN-10)&&(here.random()>1-P_PREP))
                            add_prep(x,y,z,Math.PI*a/180,block);
                        else if ((i<LEVEL_LEN-10)&&(here.random()>1-P_FONTAN))
                            add_fontan(x,y,z,Math.PI*a/180,block);

                        x+=3.5*Math.sin(Math.PI*a/180);
                        y+=0.3;
                        z+=3.5*Math.cos(Math.PI*a/180);
                        a+=7;
                        break;
                    case 2://ugol_l
                        var block=here.app.get_object("ugol_l");
                        block.position.set(x,y,z);
                        block.rotation.y=Math.PI*a/180;
                        block.avk_a=Math.PI*a/180;
                        block.avk_x=x;
                        block.avk_y=y;
                        block.avk_z=z;

                        if ((i<LEVEL_LEN-10)&&(here.random()>1-P_PREP))
                            add_prep(x,y,z,Math.PI*a/180,block);
                        else if ((i<LEVEL_LEN-10)&&(here.random()>1-P_FONTAN))
                            add_fontan(x,y,z,Math.PI*a/180,block);

                        x+=3.5*Math.sin(Math.PI*a/180);
                        y+=0.3;
                        z+=3.5*Math.cos(Math.PI*a/180);
                        a-=7;
                        break;
                }

                if (f)
                {
                    if(Array.isArray(block.material))
                    {
                        block.material[0].color.r=first_mat[0];
                        block.material[0].color.g=first_mat[1];
                        block.material[0].color.b=first_mat[2];
                        block.material[0].side=THREE.DoubleSide;
                    }else
                    {
                        block.material.color.r=first_mat[0];
                        block.material.color.g=first_mat[1];
                        block.material.color.b=first_mat[2];
                        block.material.side=THREE.DoubleSide;
                    }
                }else
                {
                    if(Array.isArray(block.material))
                    {
                        block.material[0].color.r=second_mat[0];
                        block.material[0].color.g=second_mat[1];
                        block.material[0].color.b=second_mat[2];
                        block.material[0].side=THREE.DoubleSide;
                    }else
                    {
                        block.material.color.r=second_mat[0];
                        block.material.color.g=second_mat[1];
                        block.material.color.b=second_mat[2];
                        block.material.side=THREE.DoubleSide;
                    }
                }

                f=!f;                

                here.blocks.push(block);
                here.main_scene.add(block);
            }
        }

        here.start_place=Math.floor(Math.random()*here.bots.length);//стартуем с этого места
        here.start=here.blocks[here.blocks.length-5];
        
        here.speed_x=here.speed_y=here.speed_z=0;
        here.geo.visible=false;

        if (here.start_place!=here.player.bot_id)
        {
            var tmp=here.bots[here.start_place];
            here.bots[here.start_place]=here.player;
            here.bots[here.player.bot_id]=tmp;
            
            here.bots[here.player.bot_id].bot_id=here.player.bot_id;
            here.player.bot_id=here.start_place;            
        }

        here.names[here.player.bot_id]=PROJECT.STR.player;
        for (var i=0;i<here.bots.length;i++)
        {
            var bot=here.bots[i];
            bot.condition="gorka";
            bot.play("swim");
            bot.dx=here.random()-0.5;
            bot.ddx=0;
            bot.body_speed=BODY_SPEED;
            bot.speed_up=SPEED_UP;
            bot.ms=bot.multi_speed=1;
            bot.key_dr=0;
            bot.change_tk=CHANGE_TK+here.random()*CHANGE_TK;
            bot.exit_impuls=0;

            bot.way_id=here.blocks.length-7-i*2;
            bot.da=here.random()*Math.PI*2;
            bot.way_progress=here.random();
            var start=here.blocks[bot.way_id];

            bot.rotation.x=Math.PI/2;
            bot.rotation.z=Math.PI-start.rotation.y;
            bot.position.x=start.position.x;
            bot.position.y=start.position.y+1;
            bot.position.z=start.position.z;
            bot.zvezda.visible=false;
            bot.korona.visible=false;
            bot.korona.position.y=0.5;
            bot.korona.position.z=-0.5;
            bot.korona.rotation.x=-Math.PI/2;

            bot.finish_id=-1;
            bot.bonus_tk=0;

            var s=here.names[i];
            if (s.length>13)
                s=s.substr(0,13);

            bot.set_name(s);

            bot.visible=false;
            bot.back.visible=false;
        }

        here.bonus.condition="gorka";
        here.bonus.dx=0;
        here.bonus.ddx=0;
        here.bonus.body_speed=BODY_SPEED;
        here.bonus.ms=here.bonus.multi_speed=0.6;
        here.bonus.key_dr=0;
        here.bonus.exit_impuls=0;
        here.bonus.way_id=here.blocks.length-45;
        here.bonus.way_progress=0;
        var start=here.blocks[here.bonus.way_id];

        here.bonus.rotation.x=Math.PI/2;
        here.bonus.rotation.z=Math.PI-start.rotation.y;
        here.bonus.position.x=start.position.x;
        here.bonus.position.y=start.position.y+1;
        here.bonus.position.z=start.position.z;
        here.bonus.visible=true;
        here.current_finished=0;
        run=true;
        update(10);
        run=false;
        here.set_progress(-1);
        here.app.up_gui=true;
    }

    here.set_money=function(val)
    {
        if ((here.msg)&&(here.msg.coin_place))
            here.msg.coin_place.txt_cost.text=val;

        save();
    }

    here.set_progress=function(val)
    {
        if (val>1)
            val=1;
        if (val<0)
        {
            val=0;
            here.wnd.bar.visible=false;
            here.wnd.back_bar.visible=false;
            here.wnd.fin_bar.visible=false;
            return;
        }
        here.wnd.bar.visible=true;
        here.wnd.back_bar.visible=true;
        here.wnd.fin_bar.visible=(val>=1);
        here.wnd.bar.sx=val;
    }

    here.init_level=function()
    {//
        here.begin_level_complete=false;
        function names_loaded(data)
        {
            here.begin_level_complete=true;
            here.names=JSON.parse(data);
            var nms=[];
            var l=Math.floor(here.names.length/20);

            for (var i=0; i<20; i++) 
                nms.push(here.names[i*l+Math.floor(Math.random()*l)]);

            here.names=nms;

            if (here.level_objects)
            {
                here.msg.btn_replay.visible=true;
                here.msg.wait.visible=false;
            }
            init_level_continue();
        }
        here.app.load("names.json",names_loaded);
    }

    here.begin_race=function()
    {//собственно реальный старт
        here.pos={x:here.app.camera_3d.position.x,y:here.app.camera_3d.position.y,z:here.app.camera_3d.position.z};
        here.player_start_position=here.player_current_position=here.player.position.y;
        here.player.visible=true;
        here.geo.visible=true;
        here.player.back.visible=true;
        here.msg.wait.visible=false;
        here.msg.txt_wait.visible=false;
        here.msg.txt_start.visible=true;
        
        for (var i=0;i<here.bots.length;i++)
        {
            here.bots[i].visible=true;
            here.bots[i].back.visible=true;
        }

        function on_progresssk(obj,progress,current_tk,action)
        {
            var start=here.blocks[here.player.way_id];
            here.app.camera_3d.position.z=here.pos.z+(start.position.z+5*Math.cos(start.rotation.y)-here.pos.z)*progress*progress;
            here.app.camera_3d.position.y=here.pos.y+(start.position.y+4-here.pos.y)*progress*progress;
            here.app.camera_3d.position.x=here.pos.x+(start.position.x+5*Math.sin(start.rotation.y)-here.pos.x)*progress*progress;
            here.app.camera_3d.lookAt(here.player.position);
            here.speed_x=here.speed_y=here.speed_z=0;

            here.msg.txt_start.text=Math.floor(4-3*progress);
        }

        function on_finishsk(obj,action,manual_stop)
        {
            here.app.hide_msg();
            here.msg=null;
            run=true;
            here.quiet_tk=QUIET;
            add_keys();
        }

        here.app.start(null,0,3000,null,on_progresssk,on_finishsk,true);
    }

    function start_level()
    {//нажали на кнопку старт. ждем рекламму и потом показываем появление ботов
        save();
        function start_level_after_ads()
        {//реклама закончена, пора загружать ботов
            var id=here.player.bot_id;
            for (var i=0;i<here.select.length;i++)
            {
                here.select[i].player.visible=false;
                here.select[i].player.back.visible=false;
            }
            here.bots[id]=here.select[here.player_id].player;

            var bot=here.select[here.player_id].player;
            bot.condition="gorka";
            bot.play("swim");
            bot.dx=here.player.dx;
            bot.ddx=0;
            bot.body_speed=BODY_SPEED;
            bot.speed_up=SPEED_UP;
            bot.ms=bot.multi_speed=1;
            bot.key_dr=0;
            bot.change_tk=here.player.change_tk;
            bot.exit_impuls=0;
            bot.way_id=here.player.way_id;
            bot.da=here.player.da;
            bot.way_progress=here.player.way_progress;
            bot.rotation.x=Math.PI/2;
            bot.rotation.z=here.player.rotation.z;
            bot.position.x=here.player.position.x;
            bot.position.y=here.player.position.y;
            bot.position.z=here.player.position.z;
            bot.zvezda.visible=false;
            bot.korona.visible=false;
            bot.korona.position.y=0.5;
            bot.korona.position.z=-0.5;
            bot.korona.rotation.x=-Math.PI/2;
            bot.finish_id=-1;
            bot.bonus_tk=0;
            bot.set_name(here.player.nm);
            bot.visible=false;
            bot.back.visible=false;
            bot.bot_id=here.player.bot_id;
            here.player=bot;

            finished=false;
            here.main_scene.visible=true;

            here.app.camera_3d.position.z=here.start.position.z+12*Math.cos(here.start.rotation.y);
            here.app.camera_3d.position.y=here.start.position.y+18;
            here.app.camera_3d.position.x=here.start.position.x+12*Math.sin(here.start.rotation.y);
            here.app.camera_3d.lookAt(here.player.position);

            here.speed_x=here.speed_y=here.speed_z=0;
            
            here.msg=here.app.show_msg(PROJECT.WND.MSG.children.start);
            here.msg.txt_start.text="3";//просто готовим и скрываем пока
            here.msg.txt_start.visible=false;
            here.msg.wait.visible=true;
            here.msg.txt_wait.visible=true;
            here.msg.wait.children[0].center.x=0.5;
            here.msg.wait.children[0].center.y=0.5;
            here.msg.wait.x=PROJECT.DAT.width/2;
            here.msg.wait.y=PROJECT.DAT.height/2;

            here.geo.visible=true;

            for (var i=here.bots.length-1;i>=here.start_place;i--)
            {
                here.bots[i].visible=true;
                here.bots[i].back.visible=true;
            }

            here.cur_index=-1;

            function on_bots_loading_progress(obj,progress,current_tk,action)
            {
                if (progress<1)
                {
                    var i=Math.floor((here.start_place)*(1-progress));
                    if (i!=here.cur_index)
                    {//рисуем появление ботов
                        here.cur_index=i;
                        var part=here.app.get_sprite("msg_up_part",true);
                        part.bot=here.bots[i];
                        here.main_scene.add(part);
                        part.position.x=here.bots[i].position.x;
                        part.position.y=here.bots[i].position.y;
                        part.position.z=here.bots[i].position.z;
                        part.scale.x=10;
                        part.scale.y=part.scale.z=100;
                        part.children[0].center.x=0.5;
                        part.children[0].center.y=0;
                        part.children[0].position.x=0;
                        part.children[0].position.y=0;
                        part.children[0].position.z=0;
                        part.children[0].material.sizeAttenuation=true;
                        part.children[0].material.depthTest=true;
                        here.add_part(part,"born_part");

                        function on_progresssk(obj,progress,current_tk,action)
                        {
                            obj.scale.y=(1-progress*progress)*100;
                        }

                        function on_finishsk(obj,action,manual_stop)
                        {
                            obj.destroy();
                            here.add_part(obj,"born_part");
                            obj.bot.visible=true;
                            obj.bot.back.visible=true;
                        }

                        here.app.start(part,0,250,null,on_progresssk,on_finishsk);
                    }
                }
            }

            here.app.start(null,0,here.start_place*700,null,on_bots_loading_progress,here.begin_race,true);
        }

        PROJECT.STR.player=here.htxt.value;
        here.player.set_name(PROJECT.STR.player);
        here.htxt.style.display ='none';
        PROJECT.STR.on_start_level(start_level_after_ads);
    }

    here.show_skin=function()
    {//показываем скин
        here.hint_action.stop();
        here.app.hide_msg();
        here.msg=null;
        here.select_scene.visible=true;
        here.msg=here.app.show_msg(PROJECT.WND.MSG.children.skin);

        if (typeof(SkinsOpen)!="undefined")
            SkinsOpen();

        PROJECT.STR.player=here.htxt.value;
        here.player.set_name(PROJECT.STR.player);
        here.htxt.style.display ='none';
        add_logo(here.msg);
        here.set_money(here.money);

        for (var i=0;i<here.select.length;i++)
            here.select[i].visible=false;

        here.msg.btn_buy.avk.on_click=function()
        {
            if (here.money>=PROJECT.STR.players[here.select_id].cost)
            {
                here.money-=PROJECT.STR.players[here.select_id].cost;
                here.set_money(here.money);
                here.player_byed++;
                here.player_id=here.select_id;
                refresh_gui();
            }else
            {
                here.msg.coin_place.txt_cost.avk.txt.material.color.g=0;
                here.msg.coin_place.txt_cost.avk.txt.material.color.b=0;
                function on_progresssk(obj,progress,current_tk,action)
                {
                    here.msg.coin_place.txt_cost.sx=here.msg.coin_place.txt_cost.sy=1+Math.sin(Math.PI*progress)*0.25;
                    here.msg.coin_place.txt_cost.x=here.msg.coin_place.txt_cost.p_x-here.msg.coin_place.txt_cost.p_w*(here.msg.coin_place.txt_cost.sx-1)/2;
                    here.msg.coin_place.txt_cost.y=here.msg.coin_place.txt_cost.p_y-here.msg.coin_place.txt_cost.p_h*(here.msg.coin_place.txt_cost.sy-1)/2;
                }
    
                function on_finishsk(obj,action,manual_stop)
                {
                    here.msg.coin_place.txt_cost.avk.txt.material.color.g=1;
                    here.msg.coin_place.txt_cost.avk.txt.material.color.b=1;
                }
    
                here.app.start(null,0,350,null,on_progresssk,on_finishsk);
            }
        }

        here.msg.btn_apply.avk.on_click=function()
        {
            here.player_id=here.select_id;
            refresh_gui();
        }

        function refresh_gui()
        {
            if (here.select_id==here.player_id)
            {//выбран
                here.msg.btn_buy.visible=false;
                here.msg.btn_apply.visible=false;
                here.msg.selected.visible=true;
                here.msg.lock.visible=false;
            }else if (here.select_id<=here.player_byed)
            {//куплен
                here.msg.btn_buy.visible=false;
                here.msg.btn_apply.visible=true;
                here.msg.selected.visible=false;
                here.msg.lock.visible=false;
            }else if (here.select_id==here.player_byed+1)
            {//можем купить
                here.msg.btn_buy.visible=true;
                here.msg.txt_bay.text=PROJECT.STR.get(3)+" "+PROJECT.STR.players[here.select_id].cost;
                here.msg.btn_apply.visible=false;
                here.msg.selected.visible=false;
                here.msg.lock.visible=false;
            }else
            {//залочен
                here.msg.btn_buy.visible=false;
                here.msg.btn_apply.visible=false;
                here.msg.selected.visible=false;
                here.msg.lock.visible=true;
            }

            for (var i=0;i<here.select.length;i++)
                here.select[i].visible=false;

            save();
        }

        here.msg.btn_r.avk.on_click=function()
        {//обработчик нажатия кнопки 
            here.select_id++;
            if (here.select_id>=here.select.length)
                here.select_id=0;

            refresh_gui();    
        }

        here.msg.btn_l.avk.on_click=function()
        {//обработчик нажатия кнопки 
            here.select_id--;
            if (here.select_id<0)
                here.select_id=here.select.length-1;
            refresh_gui();
        }
        here.msg.btn_back.avk.on_click=function()
        {//возврат
            here.app.hide_msg();
            here.msg=null;
            here.msg=here.app.show_msg(PROJECT.WND.MSG.children.first);
            here.htxt.style.display='';
            here.htxt.select();
            here.select_scene.visible=false;
            if (typeof(SkinsClose)!="undefined")
                SkinsClose();

            function on_finish_hint(obj,action,manual_stop)
            {//цикл показа хинтов
                if (manual_stop)
                {
                    here.hint_action=null;
                    return;
                }
                
                here.hint_action=here.app.start(null,0,3000,null,null,on_finish_hint);
                here.hint_num++;
                
                if (here.hint_num>=PROJECT.STR.hints_count)
                    here.hint_num=0;

                here.msg.txt_hint.text=PROJECT.STR.get(here.hint_num+100);
            }
            on_finish_hint();
        }
        refresh_gui();
    }

    function add_logo(wnd)
    {//добавляем логотип к окну
        if (!wnd.lg)
        {
            wnd.lg=here.app.get_sprite("main");
            wnd.lg.children[0].center.x=0.5;
            wnd.lg.children[0].center.y=0.5;
            wnd.lg.children[0].position.x=wnd.logo.p_w/2;
            wnd.lg.children[0].position.y=wnd.logo.p_h/2;
            wnd.logo.addChild(wnd.lg);
        }
    }

    function add_keys()
    {
        window.removeEventListener("keydown", onDown, true);
        window.removeEventListener("keyup", onUp, true);
        window.addEventListener("keydown", onDown, true);
        window.addEventListener("keyup", onUp, true);
    }

    here.start_game=function(back)
    {//начало игры-прелоадер закрыли
        //обработчики
        add_keys();
        if (here.is_new_level)
            free_level();
            
        if (!here.level_objects)
            load_current_level();
        here.main_scene.visible=true;
        
        if (here.msg)
        {//закрывем вин/луз экран если таковые есть
            here.app.hide_msg();
            here.msg=null;
        }else ShowAds();//иначе рекламма еще не включена
        
        here.msg=here.app.show_msg(PROJECT.WND.MSG.children.first);
        here.htxt.style.display='';
        here.htxt.select();
        
        run=false;
        
        here.select_scene.visible=false;
        if(here.level_objects)
        {//декор уже загружен
            here.msg.btn_replay.visible=here.msg.btn_skin.visible=true;
            here.msg.wait.visible=false;
        }else
        {
            here.msg.btn_replay.visible=here.msg.btn_skin.visible=false;
            here.msg.wait.visible=true;
            here.msg.wait.children[0].center.x=0.5;
            here.msg.wait.children[0].center.y=0.5;
            here.msg.wait.x=here.msg.wait.p_cx;
            here.msg.wait.y=here.msg.wait.p_cy;
        }
        
        here.msg.btn_skin.avk.on_click=here.show_skin;
        add_logo(here.msg);
        
        function on_finish_hint(obj,action,manual_stop)
        {//цикл показа хинтов
            if (manual_stop)
            {
                here.hint_action=null;
                return;
            }
            
            here.hint_action=here.app.start(null,0,3000,null,null,on_finish_hint);
            here.hint_num++;
            
            if (here.hint_num>=PROJECT.STR.hints_count)
                here.hint_num=0;

            here.msg.txt_hint.text=PROJECT.STR.get(here.hint_num+100);
        }
        on_finish_hint();

        here.msg.btn_replay.avk.on_click=function()
        {//обработчик нажатия кнопки 
            HideAds();
            here.hint_action.stop();
            here.app.hide_msg();
            here.msg=null;
            here.select_scene.visible=false;
            start_level();
        }

        here.game_scene.visible=false;
        if (!back)
            here.init_level();
    }

    here.add_water_part=function(body,r,g,b)
    {
        for (var i=0;i<1;i++)
        {
            var part=here.app.get_sprite("msg_part",true);
            here.main_scene.add(part);
            part.position.x=body.position.x+0.05*(Math.random()-0.5);
            part.position.y=body.position.y+0.05*(Math.random()-0.5);
            part.position.z=body.position.z+0.05*(Math.random()-0.5);
            part.scale.x=part.scale.y=part.scale.z=5+Math.random()*5;

            part.children[0].material.sizeAttenuation=true;
            part.children[0].material.depthTest=true;
            part.children[0].material.color.r=r;
            part.children[0].material.color.g=g;
            part.children[0].material.color.b=b;
            part.children[0].center.x=0.5;
            part.children[0].center.y=0.5;
            part.children[0].position.x=0;
            part.children[0].position.y=0;
            part.children[0].position.z=0;

            part.drx=(Math.random()*2-1);
            part.dry=(Math.random()*2-1);
            part.drz=(Math.random()*2-1);
            part.dx=(Math.random()*2-1);
            part.dz=(Math.random()*2-1);
            part.dy=10*(1+Math.random())/2;
            //part.scale.x=part.scale.y=part.scale.z=0.5;

            function on_progresssk(obj,progress,current_tk,action)
            {
                obj.position.x+=obj.dx*current_tk/1000*4;
                obj.position.z+=obj.dz*current_tk/1000*4;
                obj.position.y+=obj.dy*current_tk/1000*3;

                //obj.scale.x=obj.scale.y=obj.scale.z=0.6-progress*progress*0.4;
                obj.dy-=current_tk*20/1000;
            }

            function on_finishsk(obj,action,manual_stop)
            {
                obj.destroy();
            }

            here.app.start(part,0,550+Math.random()*550,null,on_progresssk,on_finishsk);
        }
    }

    here.add_part=function(body,name)
    {
        for (var i=0;i<15;i++)
        {
            var part=here.app.get_object(name);
            part.position.x=body.position.x+1.5*(Math.random()-0.5);
            part.position.y=body.position.y+1.5*(Math.random()-0.5);
            part.position.z=body.position.z+1.5*(Math.random()-0.5);

            part.drx=(Math.random()*2-1);
            part.dry=(Math.random()*2-1);
            part.drz=(Math.random()*2-1);
            part.dx=(Math.random()*2-1);
            part.dz=(Math.random()*2-1);
            part.dy=10*(1+Math.random())/2;
            part.scale.x=part.scale.y=part.scale.z=0.5;

            here.main_scene.add(part);
            part.rotation.x=0;
            part.rotation.z=0;
            part.rotation.y=0;
            part.material.opacity=1;

            function on_progresssk(obj,progress,current_tk,action)
            {
                obj.rotation.x+=obj.drx*current_tk/1000*4;
                obj.rotation.z+=obj.drz*current_tk/1000*4;
                obj.rotation.y+=obj.dry*current_tk/1000*4;
    
                obj.position.x+=obj.dx*current_tk/1000*4;
                obj.position.z+=obj.dz*current_tk/1000*4;
                obj.position.y+=obj.dy*current_tk/1000*2;

                obj.scale.x=obj.scale.y=obj.scale.z=0.6-progress*progress*0.4;
                obj.dy-=current_tk*20/1000;
            }

            function on_finishsk(obj,action,manual_stop)
            {
                obj.free();
            }

            here.app.start(part,0,1250+Math.random()*1250,null,on_progresssk,on_finishsk);
        }
    }

    here.add_small_particle=function(body,name)
    {
        for (var i=0;i<20;i++)
        {
            var part=here.app.get_object(name);
            part.position.x=body.position.x+(Math.random()-0.5);
            part.position.y=body.position.y+(Math.random()-0.5);
            part.position.z=body.position.z+(Math.random()-0.5);

            part.drx=(Math.random()*2-1);
            part.dry=(Math.random()*2-1);
            part.drz=(Math.random()*2-1);
            part.dx=(Math.random()*2-1);
            part.dz=(Math.random()*2-1);
            part.dy=10*(1+Math.random())/2;
            part.scale.x=part.scale.y=part.scale.z=1.5;

            here.main_scene.add(part);

            function on_progresssk(obj,progress,current_tk,action)
            {
                obj.rotation.x+=obj.drx*current_tk/1000*2;
                obj.rotation.z+=obj.drz*current_tk/1000*2;
                obj.rotation.y+=obj.dry*current_tk/1000*2;
    
                obj.position.x+=obj.dx*current_tk/1000*2;
                obj.position.z+=obj.dz*current_tk/1000*2;
                obj.position.y+=obj.dy*current_tk/1000;

                obj.scale.x=obj.scale.y=obj.scale.z=1.5-progress*progress*0.7;
                obj.dy-=current_tk*20/1000;
            }

            function on_finishsk(obj,action,manual_stop)
            {
                obj.free();
            }

            here.app.start(part,0,1250+Math.random()*1250,null,on_progresssk,on_finishsk);
        }
    }

    here.move=function(body,tk)
    {
        function add_puzir(body)
        {
            for(var i=0;i<5;i++)
            {
                var spr=here.app.get_sprite("msg_pus",true);
                here.main_scene.add(spr);
                spr.position.x=body.position.x+1.5*(Math.random()-0.5);
                spr.position.y=body.position.y+1.5*(Math.random()-0.5);
                spr.position.z=body.position.z+1.5*(Math.random()-0.5);
                spr.scale.x=spr.scale.y=spr.scale.z=5+Math.random()*5;

                spr.children[0].material.sizeAttenuation=true;
                spr.children[0].material.depthTest=true;

                function on_progresssk(obj,progress,current_tk,action)
                {
                    //obj.part.scale.x=obj.part.scale.y=0.1-progress*progress*(body.dr+3);
                    obj.children[0].material.opacity=1-progress*progress;
                    obj.position.y+=current_tk/1000;
                }

                function on_finishsk(obj,action,manual_stop)
                {
                    obj.destroy();
                }
                here.app.start(spr,0,250+Math.random()*250,null,on_progresssk,on_finishsk);
            }
        }

        function add_sled(body)
        {
            for(var i=0;i<5;i++)
            {
                var spr=here.app.get_object("part");
                here.main_scene.add(spr);
                spr.position.x=body.position.x+0.5*(Math.random()-0.5);
                spr.position.y=body.position.y+0.5*(Math.random()-0.5);
                spr.position.z=body.position.z+0.5*(Math.random()-0.5);
                spr.s=spr.scale.x=spr.scale.y=spr.scale.z=0.25+Math.random()*0.25;
                spr.material.transparent=true;

                spr.rotation.x=Math.PI*3*Math.random();
                spr.rotation.z=Math.PI*3*Math.random();
                spr.rotation.y=Math.PI*3*Math.random();

                //spr.children[0].position.x=0;
                //spr.children[0].position.y=0;
                //spr.children[0].position.z=0;
                //spr.children[0].material.sizeAttenuation=true;
                
                function on_progress(obj,progress,current_tk,action)
                {
                    obj.scale.x=obj.s-progress*obj.s*0.85;
                    obj.material.opacity=1-progress;
                }

                function on_finish(obj,action,manual_stop)
                {
                    obj.free();
                }

                here.app.start(spr,0,150+Math.random()*50,null,on_progress,on_finish);
            }
        }

        function boom(block,id,bd)
        {
            if (bd==here.bonus)
                return;

            here.add_part(bd,"part");
            bd.body_speed*=MIN_BODY_SPEED;
            bd.speed_up=SPEED_UP_DELTA;
            block.prep[id].free();
            block.prep[id]=null;
        }

        if (body.bonus_tk>0)
            body.bonus_tk-=tk;
                    
        if (body.speed_up<SPEED_UP)
        {
            body.speed_up+=tk/1000*2;
            if (body.speed_up>SPEED_UP)
                body.speed_up=SPEED_UP;
        }

        if (body.body_speed<BODY_SPEED)
        {
            body.body_speed+=tk/1000*body.speed_up;
            if (body.body_speed>BODY_SPEED)
                body.body_speed=BODY_SPEED;
        }else if (body.body_speed>BODY_SPEED)
        {
            body.body_speed-=tk/1000*body.speed_up;
            if (body.body_speed<BODY_SPEED)
                body.body_speed=BODY_SPEED;
        }        

        if (body.is_player)
        {
            if (here.player_current_position>here.player.position.y)//чтобы прогресс не скакал
                here.player_current_position=here.player.position.y;
            
            here.set_progress((here.player_start_position-here.player_current_position)/here.player_start_position);
        }

        if (body.condition=="gorka")
        {
            if (body.is_player)
            {
                body.dx-=here.swipe_dx;
                here.swipe_dx=0;
            }

            body.dx+=tk/1000*body.key_dr*DELTA_SPEED;
            body.dx+=tk/1000*body.exit_impuls;

            if ((!here.is_down)&&(body.is_player)&&(body.key_dr==0)&&(body.exit_impuls==0))
            {
                if (body.dx>0)
                {
                    body.dx-=tk/1000/4*PROJECT.STR.SPEED_CENTER;
                    if (body.dx<0)
                        body.dx=0;
                }else if (body.dx<0)
                {
                    body.dx+=tk/1000/4*PROJECT.STR.SPEED_CENTER;
                    if (body.dx>0)
                        body.dx=0;
                }
            }

            body.exit_impuls*=0.9;

            if (body.is_player)
                body.multi_speed=1+Math.abs(body.dx)/8;

            if (body.dx<-1)
            {
                body.ddx+=(body.dx+1);
                body.dx=-1;
                if (body.ddx<-OUT_BARIER)
                {
                    body.dx=0;
                    body.condition="fly";
                    body.play("fly");
                    body.avk_a=UP_A;
                    body.exit_impuls=0;
                    return;
                }
            }else if (body.dx>1)
            {
                body.ddx+=(body.dx-1);
                body.dx=1;
                if (body.ddx>OUT_BARIER)
                {
                    body.dx=0;
                    body.condition="fly";
                    body.play("fly");
                    body.avk_a=UP_A;
                    body.exit_impuls=0;
                    return;
                }
            }else body.ddx=0;

            var speed=body.body_speed;
            if (body.bonus_tk>0)
            {
                speed+=BONUS_BODY_SPEED;
            }
            if (Math.abs(body.dx)>0.25)
                speed*=NO_WATER_SPEED;

            body.way_progress+=tk/1000*speed*body.multi_speed;
            while (body.way_progress>1)
            {
                body.way_progress--;
                body.way_id--;
            }
            
            if (body.way_id>=1)
            {
                var start=here.blocks[body.way_id];
                var end=here.blocks[body.way_id-1];

                if ((body.way_progress>0.5)&&(end.prep))
                {
                    if (end.prep[0])
                    {
                        if (body.dx>0.1)
                        {
                            boom(end,0,body);
                            if (body.is_player)
                                tryaska();
                        }
                    }
                    if (end.prep[1])
                    {
                        if ((body.dx<0.3)&&(body.dx>-0.3))
                        {
                            boom(end,1,body);
                            if (body.is_player)
                                tryaska();
                        }
                    }
                    if (end.prep[2])
                    {
                        if(body.dx<-0.1)
                        {
                            boom(end,2,body);
                            if (body.is_player)
                                tryaska();
                            
                        }
                    }
                }
                
                if ((body.way_progress>0.5)&&(end.fontan)&&(here.bonus!=body))
                {
                    if (here.player==body)
                    {
                        if ((body.dx<0.2)&&(body.dx>-0.2))
                        {
                            body.dx=0;
                            body.condition="fly";
                            body.play("fly");
                            body.avk_a=UP_A;
                            body.exit_impuls=0;
                            body.position.y+=3;
                            return;
                        }
                    }else
                    {
                        if ((body.dx<0.1)&&(body.dx>-0.1))
                        {
                            body.dx=0;
                            body.condition="fly";
                            body.play("fly");
                            body.avk_a=UP_A;
                            body.exit_impuls=0;
                            body.position.y+=3;
                            return;
                        }
                    }
                }

                if ((body.way_progress>0.5)&&(start.fontan)&&(here.bonus!=body))
                {
                    if (here.player==body)
                    {
                        if ((body.dx<0.2)&&(body.dx>-0.2))
                        {
                            body.dx=0;
                            body.condition="fly";
                            body.play("fly");
                            body.avk_a=UP_A;
                            body.exit_impuls=0;
                            body.position.y+=3;
                            return;
                        }
                    }else
                    {
                        if ((body.dx<0.1)&&(body.dx>-0.1))
                        {
                            body.dx=0;
                            body.condition="fly";
                            body.play("fly");
                            body.avk_a=UP_A;
                            body.exit_impuls=0;
                            body.position.y+=3;
                            return;
                        }
                    }
                }

                body.avk_r=(start.avk_a+(end.avk_a-start.avk_a)*body.way_progress);
                
                body.rotation.z=Math.PI-body.avk_r;
                body.rotation.y=0;
                body.rotation.x=Math.PI/2;
                
                body.position.x=(start.avk_x+(end.avk_x-start.avk_x)*body.way_progress)-5*Math.cos(Math.PI/2+Math.PI/2*body.dx)*Math.cos(body.rotation.z);
                body.position.y=(start.avk_y+(end.avk_y-start.avk_y)*body.way_progress)+4-3.2*Math.sin(Math.PI/2+Math.PI/2*body.dx);
                body.position.z=(start.avk_z+(end.avk_z-start.avk_z)*body.way_progress)-5*Math.cos(Math.PI/2+Math.PI/2*body.dx)*Math.sin(body.rotation.z);

                if (body.is_player)
                {
                    //add_puzir(body);
                    var b= new THREE.Vector3( 0, 1, 0 );
                    b.x=start.avk_x+(end.avk_x-start.avk_x)*body.way_progress;
                    b.y=start.avk_y+(end.avk_y-start.avk_y)*body.way_progress;
                    b.z=start.avk_z+(end.avk_z-start.avk_z)*body.way_progress;
                    var z=b.z+DL_R*Math.cos(body.avk_r);
                    var y=b.y+DL_H;
                    var x=b.x+DL_R*Math.sin(body.avk_r);

                    here.app.camera_3d.position.x+=here.speed_x*tk/5;
                    here.app.camera_3d.position.y+=here.speed_y*tk/5;
                    here.app.camera_3d.position.z+=here.speed_z*tk/5;
                    
                    here.speed_x=here.speed_x*0.8+(x-here.app.camera_3d.position.x)/tk/4;
                    here.speed_y=here.speed_y*0.8+(y-here.app.camera_3d.position.y)/tk/4;
                    here.speed_z=here.speed_z*0.8+(z-here.app.camera_3d.position.z)/tk/4;          
                }
                
                here.vector.x=0;
                here.vector.y=1;
                here.vector.z=0;
                here.quaternion.setFromAxisAngle(here.vector,Math.PI/3*body.dx);
                body.quaternion.multiply(here.quaternion.normalize());
                
                if (body.is_player)
                    here.app.camera_3d.lookAt(body.position);

                /*if (body.is_player)
                {
                    //add_puzir(body);
                    var z=body.position.z+DL_R*Math.cos(body.avk_r);
                    var y=body.position.y+DL_H;
                    var x=body.position.x+DL_R*Math.sin(body.avk_r);

                    here.app.camera_3d.position.x+=here.speed_x*tk/5;
                    here.app.camera_3d.position.y+=here.speed_y*tk/5;
                    here.app.camera_3d.position.z+=here.speed_z*tk/5;
                    
                    here.speed_x=here.speed_x*0.8+(x-here.app.camera_3d.position.x)/tk/4;
                    here.speed_y=here.speed_y*0.8+(y-here.app.camera_3d.position.y)/tk/4;
                    here.speed_z=here.speed_z*0.8+(z-here.app.camera_3d.position.z)/tk/4;          
                }
                
                here.vector.x=0;
                here.vector.y=1;
                here.vector.z=0;
                here.quaternion.setFromAxisAngle(here.vector,Math.PI/3*body.dx);
                body.quaternion.multiply(here.quaternion.normalize());
                
                if (body.is_player)
                    here.app.camera_3d.lookAt(body.position);*/
                if ((body.body_speed>BODY_SPEED)||(body.exit_impuls>0.05)||(body.bonus_tk>0))
                    add_sled(body);
                
            }else
            {
                body.condition="up";
                body.play("up");
                body.finish_id=here.current_finished;
                here.current_finished++;
                body.korona.position.y=0;
                body.korona.position.z=-0.8;
                body.korona.rotation.x=-Math.PI*0.8;
                body.multi_speed=body.ms;
                body.dx=0;
                body.avk_a=UP_GORKA;
                return
            }
        }else if (body.condition=="fly")
        {
            if (body.is_player)
            {
                body.dx+=here.swipe_dx;
                here.swipe_dx=0;
            }
            body.dx-=tk/1000*body.key_dr*DELTA_SPEED;
            if (body.dx<-1)
                body.dx=-1;

            if (body.dx>1)
                body.dx=1;

            body.avk_a-=tk/1000*DOWN_SPEED;
            body.avk_r-=body.dx*tk/1000*ROT_SPEED;
            
            body.rotation.z=Math.PI-body.avk_r;
            body.rotation.y=0;
            body.rotation.x=Math.PI/2;
            
            body.position.x+=Math.sin(Math.PI+body.avk_r)*tk/1000*FLY_SPEED;
            body.position.y+=body.avk_a*tk/1000;
            body.position.z+=Math.cos(Math.PI+body.avk_r)*tk/1000*FLY_SPEED;

            if (body.is_player)
            {
                var z=body.position.z+DL_R*Math.cos(body.avk_r);
                var y=body.position.y+DL_H;
                var x=body.position.x+DL_R*Math.sin(body.avk_r);

                here.app.camera_3d.position.x+=here.speed_x*tk/5;
                here.app.camera_3d.position.y+=here.speed_y*tk/5;
                here.app.camera_3d.position.z+=here.speed_z*tk/5;
                
                here.speed_x=here.speed_x*0.8+(x-here.app.camera_3d.position.x)/tk/4;
                here.speed_y=here.speed_y*0.8+(y-here.app.camera_3d.position.y)/tk/4;
                here.speed_z=here.speed_z*0.8+(z-here.app.camera_3d.position.z)/tk/4;          
            }

            here.vector.x=0;
            here.vector.y=1;
            here.vector.z=0;
            here.quaternion.setFromAxisAngle(here.vector,Math.PI/3*body.dx);
            body.quaternion.multiply(here.quaternion.normalize());

            if (body.is_player)
                here.app.camera_3d.lookAt(body.position);

            for (var i=0;i<here.blocks.length;i++)
            {
                var bl=here.blocks[i];
                var l=here.app.get_length(bl.avk_x-body.position.x,bl.avk_y-body.position.y,bl.avk_z-body.position.z);
                if ((bl.avk_y<body.position.y)&&(l<6))
                {
                    body.condition="gorka";
                    body.body_speed=BODY_SPEED;
                    body.bonus_tk=0;
                    body.play("swim");
                    body.way_id=i;
                    body.dx=0;
                }
            }

            if ((body.position.y<15)&&(body.position.z<22)&&(body.position.z>-22)&&(body.position.x<14)&&(body.position.x>-14))
            {
                body.condition="up_new";
                body.finish_id=here.current_finished;
                body.korona.position.y=0;
                body.korona.position.z=-0.8;
                body.korona.rotation.x=-Math.PI*0.8;
                here.current_finished++;
                body.dx=0;
                body.multi_speed=body.ms;
                body.play("up");
                return;
            }
            if ((body.position.y<0.2)&&(body.position.y<110)&&(body.position.z<110)&&(body.position.z>-110)&&(body.position.x<110)&&(body.position.x>-110))
            {
                if (here.app.get_length(body.position.x,body.position.z)<200)
                {
                    body.position.y=0.2;
                    body.condition="out";
                    body.finish_id=-2;
                    body.dx=0;
                    body.play("out");
                    body.rotation.z=0;
                    body.rotation.y=Math.PI+body.avk_r;
                    body.rotation.x=0;
                    if (body.is_player)
                        on_fail();
                    return;
                }
            }

            if (body.position.y<0)
            {
                if (here.app.get_length(body.position.x,body.position.z)<200)
                {
                    body.position.y=0;
                    body.condition="out";
                    body.finish_id=-2;
                    body.dx=0;
                    body.play("out");
                    body.rotation.z=0;
                    body.rotation.y=Math.PI+body.avk_r;
                    body.rotation.x=0;
                    if (body.is_player)
                        on_fail();
                    return;
                }
            }
            if (body.position.y<-1.5)
            {
                body.position.y=-1.5;
                body.condition="out";
                body.finish_id=-2;
                body.dx=0;
                body.play("out");
                body.rotation.z=0;
                body.rotation.y=Math.PI+body.avk_r;
                body.rotation.x=0;
                if (body.is_player)
                    on_fail();
                return;
            }
        }else if (body.condition=="up_new")
        {//слетели с горки
            body.dx+=tk/1000*CAMERA_SPEED;
            if (body.dx>1)
                body.dx=1;

            body.avk_a-=tk/1000*DOWN_UP_SPEED;
            if (body.avk_a<-27)
                body.avk_a=-27;
            
            body.rotation.z=0;
            body.rotation.y=Math.PI+body.avk_r;
            body.rotation.x=0;
            here.vector.x=1;
            here.vector.y=0;
            here.vector.z=0;
            here.quaternion.setFromAxisAngle(here.vector,Math.PI/2-Math.atan(body.avk_a)*0.8);
            body.quaternion.multiply(here.quaternion.normalize());

            //body.position.x+=Math.sin(Math.PI+body.avk_r)*tk/1000*(UP_SPEED_START+(UP_SPEED_FIN-UP_SPEED_START)*body.dx);
            body.position.y+=body.avk_a*tk/1000;
            //body.position.z+=Math.cos(Math.PI+body.avk_r)*tk/1000*(UP_SPEED_START+(UP_SPEED_FIN-UP_SPEED_START)*body.dx);

            if (body.is_player)
            {
                var z=body.position.z+DL_R*Math.cos(body.avk_r+body.dx*Math.PI/2);
                var y=body.position.y+DL_H*Math.cos(body.dx*Math.PI/2);
                var x=body.position.x+DL_R*Math.sin(body.avk_r+body.dx*Math.PI/2);

                here.app.camera_3d.position.x+=here.speed_x*tk/5;
                here.app.camera_3d.position.y+=here.speed_y*tk/5;
                here.app.camera_3d.position.z+=here.speed_z*tk/5;
                
                here.speed_x=here.speed_x*0.8+(x-here.app.camera_3d.position.x)/tk/4;
                here.speed_y=here.speed_y*0.8+(y-here.app.camera_3d.position.y)/tk/4;
                here.speed_z=here.speed_z*0.8+(z-here.app.camera_3d.position.z)/tk/4;          

                here.app.camera_3d.lookAt(body.position);
            }

            if (body.position.y<-1.8)
            {
                body.condition="up_up";
                body.dx=0;
            }
        }else if (body.condition=="up")
        {//слетели с горки
            body.dx+=tk/1000*CAMERA_SPEED;
            if (body.dx>1)
                body.dx=1;

            body.avk_a-=tk/1000*DOWN_UP_SPEED;
            
            body.rotation.z=0;
            body.rotation.y=Math.PI+body.avk_r;
            body.rotation.x=0;
            here.vector.x=1;
            here.vector.y=0;
            here.vector.z=0;
            here.quaternion.setFromAxisAngle(here.vector,Math.PI/2-Math.atan(body.avk_a)*0.8);
            body.quaternion.multiply(here.quaternion.normalize());
            
            body.position.x+=Math.sin(Math.PI+body.avk_r)*tk/1000*(UP_SPEED_START+(UP_SPEED_FIN-UP_SPEED_START)*body.dx)*body.multi_speed;
            body.position.y+=body.avk_a*tk/1000;
            body.position.z+=Math.cos(Math.PI+body.avk_r)*tk/1000*(UP_SPEED_START+(UP_SPEED_FIN-UP_SPEED_START)*body.dx)*body.multi_speed;

            if (body.is_player)
            {
                var z=body.position.z+8*Math.cos(body.avk_r+body.dx*Math.PI/2);
                var y=body.position.y+5*Math.cos(body.dx*Math.PI/2);
                var x=body.position.x+8*Math.sin(body.avk_r+body.dx*Math.PI/2);

                here.app.camera_3d.position.x+=here.speed_x*tk/5;
                here.app.camera_3d.position.y+=here.speed_y*tk/5;
                here.app.camera_3d.position.z+=here.speed_z*tk/5;
                
                here.speed_x=here.speed_x*0.8+(x-here.app.camera_3d.position.x)/tk/4;
                here.speed_y=here.speed_y*0.8+(y-here.app.camera_3d.position.y)/tk/4;
                here.speed_z=here.speed_z*0.8+(z-here.app.camera_3d.position.z)/tk/4;          

                here.app.camera_3d.lookAt(body.position);
            }

            if (body.position.y<-1.8)
            {
                body.condition="up_up";
                body.dx=0;
            }
        }else if (body.condition=="up_up")
        {//поднимаемся из воды
            body.dx+=tk/1000/1;
            if (body.dx>1)
            {
                body.dx=1;
            }

            body.avk_a+=tk/1000*UP_UP_SPEED;
            if (body.avk_a>7)
                body.avk_a=7;
            
            body.rotation.z=0;
            body.rotation.y=Math.PI+body.avk_r;
            body.rotation.x=0;
            here.vector.x=1;
            here.vector.y=0;
            here.vector.z=0;
            here.quaternion.setFromAxisAngle(here.vector,Math.PI/2-Math.atan(body.avk_a)*0.8);
            body.quaternion.multiply(here.quaternion.normalize());
            
            //body.position.x+=Math.sin(Math.PI+body.avk_r)*tk/1000*(UP_SPEED_START+(UP_SPEED_FIN-UP_SPEED_START)*body.dx);
            body.position.y+=body.avk_a*tk/1000;
            if (body.position.y>-1.8)
            {
                body.position.y=-1.8;
                body.condition="up_swim";
                body.korona.position.y=0.7;
                body.korona.position.z=-0.4;
                body.korona.rotation.x=-Math.PI/4;

                body.play("fly");
                return;
            }else add_puzir(body);
            //body.position.z+=Math.cos(Math.PI+body.avk_r)*tk/1000*(UP_SPEED_START+(UP_SPEED_FIN-UP_SPEED_START)*body.dx);

            if (body.is_player)
            {
                here.set_progress(1);
                var z=body.position.z+8*Math.cos(body.avk_r+Math.PI/2*(1+body.dx));
                var y=body.position.y+5*(1-Math.cos(body.dx*Math.PI/2));
                var x=body.position.x+8*Math.sin(body.avk_r+Math.PI/2*(1+body.dx));

                here.app.camera_3d.position.x+=here.speed_x*tk/5;
                here.app.camera_3d.position.y+=here.speed_y*tk/5;
                here.app.camera_3d.position.z+=here.speed_z*tk/5;
                
                here.speed_x=here.speed_x*0.8+(x-here.app.camera_3d.position.x)/tk/4;
                here.speed_y=here.speed_y*0.8+(y-here.app.camera_3d.position.y)/tk/4;
                here.speed_z=here.speed_z*0.8+(z-here.app.camera_3d.position.z)/tk/4;          

                here.app.camera_3d.lookAt(body.position);
            }
        }else if (body.condition=="up_swim")
        {//плаваем
            body.position.y=-1.8+Math.sin(body.da+body.dx*Math.PI*6)/8;
            body.dx+=tk/1000/4;

            if ((!body.part)&&(body.visible))
            {
                var spr=here.app.get_plane("msg_krug");
                here.main_scene.add(spr);
                spr.position.x=body.position.x;
                spr.position.y=-1.9;
                spr.position.z=body.position.z;
                spr.rotation.x=Math.PI/2;
                body.part=spr;
                body.part.material.depthWrite=false;

                function on_progress_sk(obj,progress,current_tk,action)
                {
                    obj.part.scale.x=obj.part.scale.y=progress*(obj.dr+3);
                    obj.part.material.opacity=1-progress*progress;
                }

                function on_finish_sk(obj,action,manual_stop)
                {
                    obj.part.free();
                    obj.part=null;
                }
                body.dr=Math.random()*2;
                here.app.start(body,0,1550,null,on_progress_sk,on_finish_sk);
            }
            

            if (body.is_player)
            {
                here.set_progress(-1);
                var z=body.position.z+15*Math.cos(body.avk_r+Math.PI/2*(1+body.dx));
                var y=body.position.y+15+3*Math.abs(Math.sin(body.dx*Math.PI/2));
                var x=body.position.x+15*Math.sin(body.avk_r+Math.PI/2*(1+body.dx));

                here.app.camera_3d.position.x+=here.speed_x*tk/5;
                here.app.camera_3d.position.y+=here.speed_y*tk/5;
                here.app.camera_3d.position.z+=here.speed_z*tk/5;
                
                here.speed_x=here.speed_x*0.8+(x-here.app.camera_3d.position.x)/tk/4;
                here.speed_y=here.speed_y*0.8+(y-here.app.camera_3d.position.y)/tk/4;
                here.speed_z=here.speed_z*0.8+(z-here.app.camera_3d.position.z)/tk/4;          

                here.app.camera_3d.lookAt(body.position);
            }
        }else if (body.condition=="out")
        {//улетели
            body.zvezda.visible=true;
            body.dx+=tk/1000/4;
            body.zvezda.rotation.y=body.dx*12;
            body.zvezda.rotation.x=Math.sin(body.dx*12)/12;

            if (body.is_player)
            {
                here.set_progress(-1);
                here.main_scene.visible=false;
                here.app.up_gui=false;
                body.avk_r=0;

                body.rotation.z=0;
                body.rotation.y=Math.PI+body.avk_r;
                body.rotation.x=0;
                
                body.position.y=0;
                
                var a=1;
                var z=body.position.z+15*Math.cos(body.avk_r+Math.PI/2*(1+a));
                var y=body.position.y+6+3*Math.abs(Math.sin(a*Math.PI/2));
                var x=body.position.x+15*Math.sin(body.avk_r+Math.PI/2*(1+a));

                here.app.camera_3d.position.x+=here.speed_x*tk/5;
                here.app.camera_3d.position.y+=here.speed_y*tk/5;
                here.app.camera_3d.position.z+=here.speed_z*tk/5;
                
                here.speed_x=here.speed_x*0.8+(x-here.app.camera_3d.position.x)/tk/4;
                here.speed_y=here.speed_y*0.8+(y-here.app.camera_3d.position.y)/tk/4;
                here.speed_z=here.speed_z*0.8+(z-here.app.camera_3d.position.z)/tk/4;          

                here.app.camera_3d.lookAt(body.position);
                body.position.y=7.3;
            }
        }
    }

    function on_fail()
    {
        if (finished)
            return;
        finished=true;
        function on_real_fail()
        {
            ShowAds();
            here.msg=here.app.show_msg(PROJECT.WND.MSG.children.loose);
            if (!here.msg.lg)
            {
                here.msg.lg=here.app.get_sprite("main");
                here.msg.lg.children[0].center.x=0.5;
                here.msg.lg.children[0].center.y=0.5;
                here.msg.lg.children[0].position.x=here.msg.logo.p_w/2;
                here.msg.lg.children[0].position.y=here.msg.logo.p_h/2;
                here.msg.logo.addChild(here.msg.lg);
            }

            here.msg.logo.y=-here.msg.logo.p_h;
            var finish_str=PROJECT.STR.get(1);
            var arr=[];

            for(var i=0;i<finish_str.length;i++)
            {
                var txt=here.msg.txt_place.copy(here.msg);
                txt.text=finish_str[i];
                
                if (i==0)
                {
                    here.msg.txt_place.text=finish_str[i];
                    txt.p_w=0;
                }else 
                {
                    txt.p_w=here.msg.txt_place.children[0].canvas.textWidth;
                    here.msg.txt_place.text+=finish_str[i];
                }

                arr.push(txt);
            }

            var x=(PROJECT.DAT.width-here.msg.txt_place.children[0].canvas.textWidth)/2;
            here.msg.txt_place.text=" ";
            here.msg.btn_replay.avk.on_click=function(){PROJECT.STR.on_continue_level(here.start_game)};
            here.msg.btn_replay.enabled=false;
            here.msg.btn_replay.y-=PROJECT.DAT.width;

            for(var i=0;i<arr.length;i++)
            {
                var txt=arr[i];
                txt.x=x+txt.p_w-PROJECT.DAT.width/2+txt.children[0].canvas.textWidth/2;
                txt.fy=txt.y;
                txt.y-=PROJECT.DAT.width;
            }

            function on_progress_logo(obj,progress,current_tk,action)
            {
                obj.y=-obj.p_h*(1-progress)*(1-progress);
            }

            function on_finish_logo(obj,action,manual_stop)
            {
                for(var i=0;i<arr.length;i++)
                {
                    var txt=arr[i];

                    function on_progress_loose(obj,progress,current_tk,action)
                    {
                        obj.y=obj.fy-Math.abs(Math.cos(Math.PI*4*progress))*PROJECT.DAT.width*(1-progress)*(1-progress)*(1-progress);
                    }

                    function on_finish_loose(obj,action,manual_stop)
                    {
                        while(arr.length>0)
                        {
                            arr.pop().free();
                        }

                        here.msg.txt_place.text=PROJECT.STR.get(1);

                        function on_progress_btn(obj,progress,current_tk,action)
                        {
                            obj.y=obj.p_y-Math.abs(Math.cos(Math.PI*4*progress))*PROJECT.DAT.width*(1-progress)*(1-progress)*(1-progress);
                        }

                        function on_finish_btn(obj,action,manual_stop)
                        {
                            //here.msg.btn_replay.enabled=true;
                        }

                        here.app.start(here.msg.btn_replay,0,1000,null,on_progress_btn,on_finish_btn,true);
                    }
                        
                    if (i==arr.length-1)
                        here.app.start(txt,i*50,1500,null,on_progress_loose,on_finish_loose,true);
                    else here.app.start(txt,i*50,1500,null,on_progress_loose,null,true);
                }
            }
                
            here.app.start(here.msg.logo,250,500,null,on_progress_logo,on_finish_logo,true);
        }

        PROJECT.STR.on_finish_level(false,on_real_fail);
    }

    function add_level(wnd)
    {//добавляем логотип к окну
        if (wnd.cur_lev)
        {
            wnd.cur_lev.destroy();
            wnd.cur_lev=null;
        }

        if (wnd.next_lev)
        {
            wnd.next_lev.destroy();
            wnd.next_lev=null;
        }

        if (here.app.materials["level_ico_"+current_level])
        {
            wnd.cur_lev=here.app.get_sprite("level_ico_"+current_level);
            wnd.cur_lev.children[0].center.x=0.5;
            wnd.cur_lev.children[0].center.y=0.5;
            wnd.cur_lev.children[0].position.x=wnd.start_bar.p_w/2;
            wnd.cur_lev.children[0].position.y=wnd.start_bar.p_h/2;
            wnd.start_bar.addChild(wnd.cur_lev);
        }

        if (current_level+1<=PROJECT.STR.max_level())
        {//есть уровень
            if (here.app.materials["level_ico_"+(1+current_level)])
            {
                wnd.next_lev=here.app.get_sprite("level_ico_"+(1+current_level));
                wnd.next_lev.children[0].center.x=0.5;
                wnd.next_lev.children[0].center.y=0.5;
                wnd.next_lev.children[0].position.x=wnd.fin_bar.p_w/2;
                wnd.next_lev.children[0].position.y=wnd.fin_bar.p_h/2;
                wnd.next_lev.alpha=0.2;
                wnd.fin_bar.addChild(wnd.next_lev);
            }
        }else
        {//нет уровня
            if (here.app.materials["soon"])
            {
                wnd.next_lev=here.app.get_sprite("soon");
                wnd.next_lev.children[0].center.x=0.5;
                wnd.next_lev.children[0].center.y=0.5;
                wnd.next_lev.children[0].position.x=wnd.fin_bar.p_w/2;
                wnd.next_lev.children[0].position.y=wnd.fin_bar.p_h/2;
                wnd.fin_bar.addChild(wnd.next_lev);
            }
        }

    }

    function add_text_part(txt,x,y,r,g,b)
    {
        var part=here.wnd.txt_part.copy(here.msg);
        part.text=txt;
        part.avk.txt.material.color.r=0;
        part.avk.txt.material.color.g=0;
        part.avk.txt.material.color.b=0;
        part.x=x;
        part.y=y;

        part.part=here.wnd.txt_part.copy(part);
        part.part.text=txt;
        part.part.avk.txt.material.color.r=r/255;
        part.part.avk.txt.material.color.g=g/255;
        part.part.avk.txt.material.color.b=b/255;
        part.part.x=0;
        part.part.y=-2;

        function on_progress(obj,progress,current_tk,action)
        {
            obj.y-=30*current_tk/1000;
            obj.x+=10*current_tk/1000;
        }

        function on_finish(obj,action,manual_stop)
        {
            obj.part.free();
            obj.free();
        }

        here.app.start(part,0,1000,null,on_progress,on_finish);
    }

    function start_particle()
    {
        for (var i=0;i<50;i++)
        {
            var part=PROJECT.WND.MSG.children["part_"+Math.floor(Math.random()*5)].copy(here.wnd);
            part.stx=part.x=PROJECT.DAT.width/2+PROJECT.DAT.width*(1-Math.random()*2)/2;//here.app.app_gfx.y/here.app.scale;
            part.sty=part.y=PROJECT.DAT.height*Math.random()-PROJECT.DAT.height/2;
            part.vs=Math.random()+3;
            part.tx=PROJECT.DAT.width/2+(Math.random()-0.5)*PROJECT.DAT.width*2;
            part.children[0].material.rotation=part.sr=(Math.random()-0.5)*Math.PI*2;
            part.r=(Math.random()-0.5)*Math.PI*2;
            part.sx=part.sy=0;

            function on_progress(obj,progress,current_tk,action)
            {
                obj.children[0].material.rotation=part.sr+progress*obj.r*6;
                obj.sy=Math.sin(progress*Math.PI);
                obj.sx=Math.sin(progress*Math.PI*8)*obj.sy;
                obj.y=obj.sty+progress*PROJECT.DAT.height;
                obj.x=obj.stx+Math.sin(Math.PI*progress)*(obj.tx-obj.stx);
            }

            function on_finish(obj,action,manual_stop)
            {
                obj.free();
            }

            here.app.start(part,0,part.vs*550,null,on_progress,on_finish);
        }
    }

    function free_level()
    {
        here.is_new_level=false;
        here.level_objects.parent.remove(here.level_objects);
        here.level_objects=null;
    }

    here.is_new_level=false;
    function on_win()
    {
        if (finished)
            return;
        finished=true;

        function on_real_win()
        {
            ShowAds();
            here.msg=here.app.show_msg(PROJECT.WND.MSG.children.win);
            if (current_level+1<=PROJECT.STR.max_level())
            {//есть уровень

                win_level_cnt++;
                if (win_level_cnt==here.level_info.cnt)
                {
                    start_particle();
                    current_level++;
                    here.is_new_level=true;
                    here.msg.txt_progress.text=PROJECT.STR.get(8);
                    here.msg.txt_progress_down.text=PROJECT.STR.get(8);
                    here.msg.bar.sx=0;

                    add_text_part(PROJECT.STR.get(9),here.msg.bar.x+here.msg.bar.p_w/2,here.msg.txt_progress.y,255,45,45);
                }else
                {

                    here.msg.txt_progress.text=here.app.convert(win_level_cnt)+" / "+here.level_info.cnt;
                    here.msg.txt_progress_down.text=here.app.convert(win_level_cnt)+" / "+here.level_info.cnt;
                    here.msg.bar.sx=win_level_cnt/here.level_info.cnt;

                    add_text_part("+ 1",here.msg.bar.x+here.msg.bar.p_w/2,here.msg.txt_progress.y,255,255,255);
                }
            }else
            {
                win_level_cnt=0;
                here.msg.txt_progress_down.text=here.msg.txt_progress.text=" ";
                here.msg.bar.sx=0;
            }

            add_level(here.msg);
            here.set_money(here.money);
            if (!here.msg.lg)
            {
                here.msg.lg=here.app.get_sprite("main");
                here.msg.lg.children[0].center.x=0.5;
                here.msg.lg.children[0].center.y=0.5;
                here.msg.lg.children[0].position.x=here.msg.logo.p_w/2;
                here.msg.lg.children[0].position.y=here.msg.logo.p_h/2;
                here.msg.logo.addChild(here.msg.lg);
            }

            if (!here.msg.places)
            {
                here.msg.places=[];
                for (var i=0;i<3;i++)
                {
                    var pl=PROJECT.WND.MSG.children.place.copy(here.msg.win_place);
                    pl.txt_place.text=(1+i);
                    pl.txt_cost_up.text=pl.txt_cost.text="+"+PROJECT.STR.places_costs[i];
                    pl.y=here.msg.win_place.p_h/3*i;
                    pl.kor.visible=(i==0);
                    pl.obvodka.visible=false;
                    here.msg.places.push(pl);
                }
            }

            for (var i=0;i<here.msg.places.length;i++)
            {
                var pl=here.msg.places[i];
                pl.obvodka.visible=false;
                pl.x=-PROJECT.DAT.width;
                pl.txt_name.text="-";
                pl.alpha=0.1;
                pl.visible=false;
            }

            if ((here.player.finish_id<3)&&(here.player.finish_id>=0))
            {
                var pl=here.msg.places[here.player.finish_id];
                pl.alpha=1;
                pl.txt_name.text=here.player.nm;
                pl.obvodka.visible=true;

                here.money_part=PROJECT.WND.MSG.children.coin_part.copy(here.wnd);
                here.money_part.x=here.msg.win_place.x+pl.p_x+pl.coin.x;
                here.money_part.y=here.msg.win_place.y+pl.y+pl.coin.y;
                here.money_part.visible=false;
                here.money_part.prize=PROJECT.STR.places_costs[here.player.finish_id];
                //here.set_money(here.money);
            }

            for (var i=0;i<here.bots.length;i++)
            {
                var bot=here.bots[i];
                if ((bot.finish_id<3)&&(bot.finish_id>=0))
                {
                    var pl=here.msg.places[bot.finish_id];
                    pl.txt_name.text=bot.nm;
                    pl.alpha=1;
                }
            }

            here.msg.logo.y=-here.msg.logo.p_h;
            here.msg.btn_replay.y-=PROJECT.DAT.width;

            function on_progress_logo(obj,progress,current_tk,action)
            {
                obj.y=-obj.p_h*(1-progress)*(1-progress);
            }

            function on_finish_logo(obj,action,manual_stop)
            {
                for (var i=here.msg.places.length-1;i>=0;i--)
                {
                    var txt=here.msg.places[i];

                    function on_progress_win(obj,progress,current_tk,action)
                    {
                        obj.x=obj.p_x-Math.abs(Math.cos(Math.PI*4*progress))*PROJECT.DAT.width*(1-progress)*(1-progress)*(1-progress);
                        obj.visible=true;
                    }

                    function on_finish_win(obj,action,manual_stop)
                    {
                        if (here.money_part)
                        {
                            here.msg.addChild(here.money_part);
                            here.money_part.visible=true;
                            here.money_part.start_x=here.money_part.x;
                            here.money_part.start_y=here.money_part.y;
                            function on_progresssk(obj,progress,current_tk,action)
                            {
                                obj.sx=1+Math.sin(Math.PI*progress)/2;
                                obj.sy=1+Math.sin(Math.PI*progress)/2;
                                obj.x=obj.start_x+(here.msg.coin_place.x-obj.start_x)*progress;
                                obj.y=obj.start_y+(here.msg.coin_place.y-obj.start_y)*progress+100*Math.sin(Math.PI*progress);
                            }

                            function on_finishsk(obj,action,manual_stop)
                            {
                                obj.free();
                                add_text_part("+"+here.money_part.prize,here.msg.coin_place.x+here.msg.coin_place.p_w/2,here.msg.coin_place.y,255,255,255);

                                here.money+=here.money_part.prize;
                                here.set_money(here.money);
                                here.money_part=null;
                            }

                            here.app.start(here.money_part,0,550,null,on_progresssk,on_finishsk,true);
                        }
                        function on_progress_btn(obj,progress,current_tk,action)
                        {
                            obj.y=obj.p_y-Math.abs(Math.cos(Math.PI*4*progress))*PROJECT.DAT.width*(1-progress)*(1-progress)*(1-progress);
                        }

                        function on_finish_btn(obj,action,manual_stop)
                        {
                            //here.msg.btn_replay.enabled=true;
                        }

                        here.app.start(here.msg.btn_replay,0,1000,null,on_progress_btn,on_finish_btn,true);
                    }
                        
                    if (i==here.msg.places.length-1)
                        here.app.start(txt,i*50,1500,null,on_progress_win,on_finish_win,true);
                    else here.app.start(txt,i*50,1500,null,on_progress_win,null,true);
                }
            }
                
            here.app.start(here.msg.logo,250,500,null,on_progress_logo,on_finish_logo,true);
            here.msg.btn_replay.avk.on_click=function(){PROJECT.STR.on_continue_level(here.start_game)};
        }

        PROJECT.STR.on_finish_level(true,on_real_win);
    }

    function tryaska()
    {
        function on_progresssk(obj,progress,current_tk,action)
        {
            obj.y=-PROJECT.DAT.height/1000*Math.abs(Math.sin(Math.PI*8*progress))*(1-progress)*Math.abs(Math.cos(Math.PI*22*progress));
            obj.x=-PROJECT.DAT.height/3000*Math.abs(Math.sin(Math.PI*10*progress))*(1-progress)*Math.abs(Math.cos(Math.PI*16*progress));
            //obj.rotation=0.04*Math.abs(Math.sin(Math.PI*10*progress))*(1-progress)*Math.abs(Math.cos(Math.PI*16*progress));
        }

        function on_finishsk(obj,action,manual_stop)
        {
            obj.x=0;
            obj.y=0;
            //obj.rotation=0;
            //here.msg=here.app.show_msg(PROJECT.WND.MSG.children.fail);
            //here.app.shadow_interactive_on(null,on_next,null,null);
        }
            
        here.app.start(here.main_scene,0,250,null,on_progresssk,on_finishsk);
    }

    function verify(body)
    {
        for (var i=0;i<here.bots.length;i++)
        {
            var bot=here.bots[i];
            if ((bot!=body)&&(bot.condition=="gorka"))
            {
                var l=here.app.get_length(bot.position.x-body.position.x,bot.position.y-body.position.y,bot.position.z-body.position.z);
                if (l<1.9)
                {
                    if ((body==here.player)&&(Math.abs(body.dx-bot.dx)>0.07))
                    {
                        if (l<1.5)
                        {
                            if (body.dx<bot.dx)
                                bot.exit_impuls=4;
                            else bot.exit_impuls=-4;
                            //tryaska();
                        }
                    }else
                    {
                        if (bot.y>body.y)
                        {
                            bot.body_speed=MIN_STOP_SPEED;
                            body.body_speed=MAX_BODY_SPEED_TAP;
                        }else
                        {
                            body.body_speed=MIN_STOP_SPEED;
                            bot.body_speed=MAX_BODY_SPEED_TAP;
                        }
                        //if (body==here.player)
                            //tryaska();
                    }
                }
            }
        }
    }

    here.geo_rot=1000;
    here.geo_rot_tk=1000;
    function do_ai(tk,min_y)
    {//типа искусственный интеллект
        for (var i=0;i<here.bots.length;i++)
        {//управляем только ботами 
            var bot=here.bots[i];
            if (bot!=here.player)
            {
                bot.change_tk-=tk;
                if (bot.change_tk<=0)
                {
                    if (Math.random()>0.1)
                        bot.key_dr=0;
                    else 
                    {
                        if (bot.ddx>0)
                        {
                            if (Math.random()>0.1)
                                bot.key_dr=-0.1;
                            else if (Math.random()>0.8)
                                bot.key_dr=0;
                            else bot.key_dr=0.1;
                        }else if (bot.ddx<0)
                        {
                            if (Math.random()>0.1)
                                bot.key_dr=0.1;
                            else if (Math.random()>0.8)
                                bot.key_dr=0;
                            else bot.key_dr=-0.1;
                        }else
                        {
                            if (bot.dx<0)
                                bot.key_dr=0.5;
                            else bot.key_dr=-0.5;
                        }
                    }
                    bot.change_tk=CHANGE_TK+Math.random()*CHANGE_TK;
                    bot.ms=bot.multi_speed=0.8+0.6*Math.random();
                }
                bot.multi_speed=bot.ms;

                //здкесь боты читерят
                if ((here.player.condition=="gorka")&&(bot.condition=="gorka"))
                {
                    if (here.player.prg>min_y+4)
                    {//тормозим ботов
                        var ds=0.3*Math.sqrt(Math.sqrt(here.quiet_tk/QUIET));
                        if (bot.multi_speed-ds<0.2)
                            ds=bot.multi_speed-0.2;
                        bot.multi_speed=bot.ms-ds;
                    }
                    
                    if (here.player.prg+5<min_y)
                    {//ускоряем ботов
                        var ds=15;
                        bot.multi_speed=bot.ms+ds;
                    }else if (here.player.prg-PROJECT.STR.DIFFICULT<min_y)
                    {//ускоряем ботов немного
                        var ds=(min_y-here.player.prg+PROJECT.STR.DIFFICULT)/4;
                        bot.multi_speed=bot.ms+ds;
                    }
                }else if (bot.condition=="gorka")
                {
                    if ((here.player.condition!="fly")&&(bot.way_id>30))
                        bot.multi_speed=50;
                    else bot.multi_speed=bot.ms;
                }
            }
        }
    }

    function update(tk)
    {
        here.sum_tk+=tk;
        if ((here.msg)&&(here.msg.wait))
            here.msg.wait.children[0].material.rotation=-here.sum_tk/200;

        if (tk>100)
            tk=100;
        here.on_resize();

        here.quiet_tk-=tk;
        if (here.quiet_tk<0)
            here.quiet_tk=0;

        if (run)
        {
            for(var i=0;i<here.fontan.length;i++)
                here.add_water_part(here.fontan[i],0.6,0.6,1);

            if (here.player.condition=="up_swim")
                on_win();

            here.move(here.bonus,tk);

            if (here.bonus.way_id<2)
            {
                here.bonus.way_id=10;
                here.bonus.visible=false;
            }

            var max_y=-1000000;
            var min_y=1000000;
            var arr=[];

            for (var i=0;i<here.bots.length;i++)
            {//апдейтим положение и прогресс, проверяем бонус
                var bot=here.bots[i];
                here.move(bot,tk);

                bot.back.position.x=bot.position.x;
                bot.back.position.y=bot.position.y+1.75;
                bot.back.position.z=bot.position.z;

                if (bot.action)
                {
                    bot.mixer.update(tk/1000);
                    if ((bot.condition=="up")||(bot.condition=="up_new"))
                    {
                        bot.action.time=0;
                    }
                    if (bot.condition=="up_swim")
                    {
                        bot.mixer.update(3*tk/1000);
                    }
                }

                if (bot.condition=="gorka")
                {
                    bot.prg=bot.way_id+(1-bot.way_progress);

                    if (bot!=here.player)
                    {//вычисляем только для ботов
                        if (max_y<bot.prg)
                            max_y=bot.prg;
                        if (min_y>bot.prg)
                            min_y=bot.prg;
                    }

                    if (here.bonus.visible)
                    {
                        if (here.app.get_length(here.bonus.position.x-bot.position.x,here.bonus.position.y-bot.position.y,here.bonus.position.z-bot.position.z)<2)
                        {
                            bot.bonus_tk=BONUS_TK*1000;
                            if (here.player.condition=="gorka")
                                here.bonus.way_id=here.player.way_id-30;
                            else here.bonus.way_id=bot.way_id-30;

                            here.add_small_particle(bot,"small");
                            if (here.bonus.way_id<2)
                            {
                                here.bonus.way_id=10;
                                here.bonus.visible=false;
                            }
                        }
                    }

                    verify(bot);
                }

                if (bot.finish_id==-1)
                {
                    if (bot.condition=="gorka")
                        arr.push(bot)
                    else if (bot.condition=="out")
                        bot.set_place(-2);
                    else bot.set_place(-1);
                }else if (bot.finish_id==-2)
                    bot.set_place(-2);
                else bot.set_place(bot.finish_id+1);

                bot.korona.visible=(bot.finish_id==0);//если кто то финишировал уже
            }

            here.geo.position.x=here.player.position.x;
            here.geo.position.y=here.player.position.y;
            here.geo.position.z=here.player.position.z;
            here.geo.rotation.y=here.player.avk_r;
            here.geo_rot-=tk/3;
            if (here.geo_rot<=0)
            {
                here.geo_rot_tk-=tk*2;
                here.geo.rotation.y=here.player.avk_r+here.geo_rot_tk*Math.PI*2/1000;

                if (here.geo_rot_tk<=0)
                {
                    here.geo_rot_tk=1000;
                    here.geo_rot=1000;
                    here.geo.rotation.y=here.player.avk_r;
                }
            }

            if (here.current_finished==0)
            {//показываем корону если еще не финишироваля
                for (var i=0;i<here.bots.length;i++)
                {
                    var bot=here.bots[i];
                    if ((bot.prg==min_y)&&(bot.condition=="gorka"))
                        bot.korona.visible=true;
                }
            }
            
            do_ai(tk,min_y);

            do 
            {//сортируем по местам
                var f=false;
                for (i=0;i<arr.length-1;i++)
                {
                    if (arr[i].prg>arr[i+1].prg)
                    {
                        var t=arr[i+1];
                        arr[i+1]=arr[i];
                        arr[i]=t;
                        f=true;
                    }
                }
            } while (f);

            //ускоряем отстающих и показываем текущее место
            here.player.ms=here.player.multi_speed=1;
            for (i=0;i<arr.length;i++)
            {
                arr[i].set_place(here.current_finished+i+1);

                if (((i>5)||(arr[i]!=here.player))&&(arr[i].condition=="gorka"))
                    arr[i].multi_speed+=i/40;
            }

            while (arr.length>0)
                arr.pop();
        }else here.set_progress(-1);

        if ((here.msg)&&(!here.msg.txt_progress)&&(!here.msg.txt_place)&&(!here.msg.txt_wait)&&(here.start))
        {
            var body=here.select[here.select_id];
            body.visible=true;
            body.rotation.y=-here.sum_tk/450;
            body.position.x=here.blocks[here.blocks.length-12].position.x;
            body.position.y=here.blocks[here.blocks.length-12].position.y+10;
            body.position.z=here.blocks[here.blocks.length-12].position.z;

            var l=here.app.get_length(body.position.x-here.blocks[here.blocks.length-1].position.x,body.position.z-here.blocks[here.blocks.length-1].position.z);
            
            if (body.action)
                body.mixer.update(tk/1000);
            var z=body.position.z-(body.position.z-here.blocks[here.blocks.length-1].position.z)/l*11;
            var y=body.position.y+6;
            var x=body.position.x-(body.position.x-here.blocks[here.blocks.length-1].position.x)/l*11;

            here.app.camera_3d.position.x=x;
            here.app.camera_3d.position.y=y;
            here.app.camera_3d.position.z=z;
            here.app.camera_3d.lookAt(body.position);
            body.position.y+=4.8;


            /*here.app.camera_3d.position.z=here.start.position.z+12*Math.cos(here.start.rotation.y);
            here.app.camera_3d.position.y=here.start.position.y+18;
            here.app.camera_3d.position.x=here.start.position.x+12*Math.sin(here.start.rotation.y);
            here.app.camera_3d.lookAt(here.blocks[here.blocks.length-8]);*/
        }
    }

    here.load_level=function(name,on_back)
    {//загрузка obj файла
        if (here.level_objects)
        {
            on_back(here.level_objects);
            return;
        }

        here.level_loader = new THREE.OBJLoader();
        here.mtl_loader = new THREE.MTLLoader();
        here.level_name=name;
        here.level_back=on_back;

        function on_level_mtl_loaded(materials)
        {
            function on_obj_loaded(obj)
            {
                here.level_objects=obj;
                here.level_back(obj);
            }

            materials.preload();
            here.level_loader.setMaterials(materials);
            here.level_loader.load(here.level_name+'.obj'+here.app.ver,on_obj_loaded);
        }
        here.mtl_loader.load(name+'.mtl'+here.app.ver,on_level_mtl_loaded);
    }
}