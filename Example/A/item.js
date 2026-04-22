// Kita buat supaya saat musuh mati makan akan mengeluarkan item
const drawItem = {}
const item = {
  heal : {x:0,y:0,width:40,height:40,img:"heal",lifeTime:10, duration:4, scene:"1", type :"item"},
  energi : {x:0,y:0,width:40,height:40,img:"energi",lifeTime:10, duration:5, scene:"1", type :"item"},
  peluruGanda : {x:0,y:0,width:40,height:40,img:"peluruGanda",lifeTime:10, duration:4, scene:"1", type :"item"},
}

const listItem = [
  {nama:"heal", peluang:0.3},
  {nama:"energi", peluang:0.3},
  {nama:"peluruGanda", peluang:0.4},
  ]
  
function getItem(){
  let step = 0
  let rand = Math.random()
  for(let itm of listItem){
    step += itm.peluang
    if(rand<step)return itm.nama
  }
  return null
}

function miyaMengambilItem(hero, physics){
  physics.aabb(hero, "item",(miya, item)=>{
    miya.statusItem = item.img
    miya.durasiItem = item.duration
    delete drawItem[item.id]
  })
}

function miyaMenerimaEfekItem(hpBar, manaBar, hero, dt, utils){
  const miya = hero.miya
  
  switch(miya.statusItem){
    case "heal":
      miya.hp = Math.min(150, miya.hp + 5 *dt)
      hpBar.setValue(miya.hp)
      
      miya.durasiItem -= dt
      utils.splitTime(dt,"heal","0.3 0.3", (on)=>{
        if(on.timer1) miya.tintColor = "lime"
        if(on.timer2) miya.tintColor = "white"
      })
      if(miya.durasiItem<=0){
        miya.statusItem = ""
        miya.durasiItem = 0
      }
      break
    case "energi":
      miya.energi = Math.min(100, miya.energi + 5 *dt)
      manaBar.setValue(miya.energi)
      
      miya.durasiItem -= dt
      utils.splitTime(dt,"energi","0.3 0.3", (on)=>{
        if(on.timer1) miya.tintColor = "yellow"
        if(on.timer2) miya.tintColor = "white"
      })
      if(miya.durasiItem<=0){
        miya.statusItem = ""
        miya.durasiItem = 0
      }
      break
    case "peluruGanda":
      miya.durasiItem -= dt
      utils.splitTime(dt,"energi","0.3 0.3", (on)=>{
        if(on.timer1) miya.tintColor = "purple"
        if(on.timer2) miya.tintColor = "white"
      })
      if(miya.durasiItem<=0){
        miya.statusItem = ""
        miya.durasiItem = 0
      }
      break
  }
}
