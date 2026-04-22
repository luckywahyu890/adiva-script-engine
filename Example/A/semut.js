function logikaMonsterJungler(dt, miya,monster, physics){
  monster.useCollider ??= true
  monster.colliderBox ??= {width : 50, height :50}
  monster.speed ??= 1
  monster.gravity ??= 2000
  monster.vx ??= 0
  monster.vy ??= 0
  monster.tintColor = "white"
  
  physics.applyPhysics(dt, monster)
  monster.vy += monster.gravity * dt
  
  const dx = miya.x - monster.x
  const dis = Math.abs(dx)
  
  //jika jarak miya dan musuh sudah lebih kecil dsri 300 maka buat monster mengejar
  if(dis < 300){
    monster.isChase = true
  }
  
  if(monster.hp <=0){
    monster.scene = "inactive"
  }
  
  if(monster.isChase){
    if(dis>60){
      if(dx > 5){
        monster.vx += monster.speed 
      }else if(dx<-5){
        monster.vx -= monster.speed 
      }
    }
  }
  
}

function hpMonster(dt, monster, camera, renderer){
  monster.hpVisual ??= monster.hp;
  monster.hpVisual -= (monster.hpVisual - monster.hp) *5 *dt
  
  renderer.fillRect(monster.x - camera.x, monster.y - camera.y, monster.hpVisual, 8, "maroon")
  renderer.fillRect(monster.x - camera.x, monster.y - camera.y, monster.hp, 8, "red")
}

function panahMiyaVsMonster(dt, panah, physics){
  physics.aabb(panah, "buff", (g1, g2)=>{
    if(!g2.isChase)return
    g2.hp -=10
    g2.tintColor = "red"
    delete panah[g1.id]
  })
}
function miyaVsMonster(dt,hero, hpBar, physics){
  physics.aabb(hero, "buff", (g1, g2)=>{
    hpBar.setValue(g1.hp);
    g1.hp-=0.8
  })
}
