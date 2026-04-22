class Kelomang extends AI_Behaviour{
  decide(player){
    const e = this.getEntity()
    
    const dx = e.x - player.x;
    const dis = Math.abs(dx)
    
    if(e.hp < 30) return "C"
    
    if(dis < 500) return "B"
    
    return "A"
  }
  
  getPatterns(){
    return {
      A : [["kelomangDiam", 1]],
      B : [
        ["kelomangNgejar", 1],
        ["kelomangNembak", 1],
        ["kelomangLompat", 0.7],
        ["kelomangNembak", 0.4],
        ["kelomangLompat", 0.5],
        ["kelomangNembak", 0.4],
        ],
      C : [
        ["kelomangNgejar", 1],
        ["kelomangLompat", 0.3],
        ["kelomangNembak", 1],
        ["kelomangLompat", 0.2],
        ["kelomangNembak", 1],
        ],
      
    }
  }
}

//buat objrk dari class yg kita buat tadi
Object.values(kelomang).forEach(el => {
  el.ai = new Kelomang(el)
})

//untuk wadah peluru kelomang
const bulletKelomang = {}


function logikaKelomang(dt, miya, physics){
  
   Object.values(kelomang).forEach(el => {
     el.ai.update(dt, miya)
     
     el.useCollider ??= true
     el.colliderBox ??= {width : 50, height: 70}
     el.gravity ??= 2000
     el.vx ??=0
     el.vy ??=0
     el.tintColor = "white"
     if(el.hp<=0) {
       el.scene = "inactive"
       const dropItem = getItem()
       const id = crypto.randomUUID()
       if(dropItem&&!el.isDead){
         el.isDead = true
         drawItem[id] = {
           ...item[dropItem]
         }
         drawItem[id].x = el.x + el.width/2
         drawItem[id].y = el.y + el.height/2
         drawItem[id].id = id
         return
       }
       
     }
     
     physics.applyPhysics(dt, el)
     el.vy += el.gravity * dt
     
     switch(el.state){
       case "kelomangDiam" :
         el.vx = 0
         el.img = "kelomang"
         break
       case "kelomangNgejar" :
         const dx = miya.x - el.x;
         const dis = Math.abs(dx)
         el.img = "kelomang"
         if(dis>60){
           if(dx > 5){
             el.vx = 100
           } else if(dx < -5){
             el.vx = -100
           }
         }
         
         break
       case "kelomangNembak" :
         el.timeSpawnPeluru ??=0.2
         
         el.timeSpawnPeluru -= dt
         el.img = "kelomangNembak"
         if(el.timeSpawnPeluru <=0){
           el.timeSpawnPeluru = 0.5
            const id = crypto.randomUUID()
            bulletKelomang[id] = {
              id,
              x : el.x + el.width/2,
              y : el.y + el.height/2.5,
              img :"kelomang",
              scene : el.scene,
              type :"anakKelomang",
              width :50,
              height :50,
              dir : el.animationDirection==="right"?1:-1,
              animationDirection : el.animationDirection,
              lifeTime : 3
            }
         }
         el.vx = 0
         break
       case "kelomangLompat" :
         el.vy = -200
         break
     }
  })
}

function updateBulletKelomang(dt, physics){
  Object.values(bulletKelomang).forEach(el =>{
    el.vx ??=0
    el.vy ??=0
    el.gravity ??=2000
    el.useCollider ??=true
    el.colliderBox ??={width:20, height:50}
    
    el.x += el.dir * 100 * dt
    physics.applyPhysics(dt, el)
    el.vy += el.gravity * dt
    el.lifeTime -= dt;
    if(el.lifeTime<=0)delete bulletKelomang[el.id]
  })
}

function hpKelomang(dt, monster, camera, renderer){
  if(monster.hp<=0)return
  monster.hpVisual ??= monster.hp;
  monster.hpVisual -= (monster.hpVisual - monster.hp) *5 *dt
  
  renderer.fillRect(monster.x - camera.x, monster.y - camera.y, monster.hpVisual, 8, "maroon")
  renderer.fillRect(monster.x - camera.x, monster.y - camera.y, monster.hp, 8, "red")
}

function panahMiyaVsKelomang(dt, panah, physics){
  physics.aabb(panah, "kelomang", (g1, g2)=>{
    
    g2.hp -=10
    g2.tintColor = "red"
    delete panah[g1.id]
  })
}

function miyaVsKelomang(dt,hero, hpBar, physics){
  physics.aabb(hero, "kelomang", (g1, g2)=>{
    g1.hp-=0.8
    hpBar.setValue(g1.hp);
  })
}

function anakKelomangVsMiya(dt,hero, hpBar, physics){
  physics.aabb(hero, "anakKelomang", (g1, g2)=>{
    g1.hp-=10
    hpBar.setValue(g1.hp);
    delete bulletKelomang[g2.id]
  })
}
