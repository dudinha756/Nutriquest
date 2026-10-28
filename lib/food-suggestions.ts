// Sugestões de refeições e experiências: não são prescrições nem porções "liberadas".
// A pontuação só muda o destaque. Todas as ideias permanecem disponíveis sempre.
export type FoodCategory = "Todas" | "Japonês" | "Pizza e massas" | "Lanches" | "Doces" | "Brasileira";
export type FoodIdea = {
 id:string;
 category:Exclude<FoodCategory,"Todas">;
 icon:string;
 title:string;
 description:string;
 note:string;
};

export const foodCategories:FoodCategory[]=["Todas","Japonês","Pizza e massas","Lanches","Doces","Brasileira"];

export const foodIdeas:FoodIdea[]=[
 {id:"sushi",category:"Japonês",icon:"🍣",title:"Noite de sushi",description:"Que tal escolher seus sushis, sashimis ou combinados favoritos?",note:"Se você gosta da ideia de 30 peças, trate isso como uma preferência pessoal, nunca como quantidade obrigatória ou liberada."},
 {id:"temaki",category:"Japonês",icon:"🍙",title:"Temaki do seu jeito",description:"Escolha o recheio e os acompanhamentos que mais gosta.",note:"Uma boa opção para um jantar especial, independentemente dos pontos."},
 {id:"yakisoba",category:"Japonês",icon:"🍜",title:"Yakisoba",description:"Legumes, macarrão e os acompanhamentos que fazem sentido para você.",note:"Pode fazer parte de uma alimentação variada."},
 {id:"ramen",category:"Japonês",icon:"🍜",title:"Lámen ou udon",description:"Uma refeição quentinha e especial para uma noite tranquila.",note:"Aproveite a experiência e sua preferência pessoal."},
 {id:"pizza",category:"Pizza e massas",icon:"🍕",title:"Noite da pizza",description:"Escolha seu sabor preferido e combine com uma ocasião agradável.",note:"Pizza não precisa ser compensada antes ou depois."},
 {id:"massa",category:"Pizza e massas",icon:"🍝",title:"Massa favorita",description:"Macarrão com o molho que você mais gosta, em casa ou fora.",note:"Uma refeição planejada também pode ser prazerosa."},
 {id:"lasanha",category:"Pizza e massas",icon:"🧀",title:"Lasanha",description:"Uma opção para compartilhar em família ou no fim de semana.",note:"O importante é que a escolha combine com você."},
 {id:"risoto",category:"Pizza e massas",icon:"🍚",title:"Risoto especial",description:"Um prato diferente para cozinhar ou pedir em um restaurante.",note:"Escolha ingredientes de que goste e aproveite o momento."},
 {id:"hamburguer",category:"Lanches",icon:"🍔",title:"Hambúrguer favorito",description:"Um lanche caprichado, com acompanhamentos da sua preferência.",note:"Não é necessário juntar pontos para desfrutar dele."},
 {id:"pastel",category:"Lanches",icon:"🥟",title:"Pastel ou salgado",description:"Que tal um pastel do seu recheio preferido?",note:"Um alimento isolado não define a qualidade da sua semana."},
 {id:"sanduiche",category:"Lanches",icon:"🥪",title:"Sanduíche especial",description:"Monte com os ingredientes e sabores de que mais gosta.",note:"Uma ideia simples para variar o cardápio."},
 {id:"brunch",category:"Lanches",icon:"🥐",title:"Brunch ou café especial",description:"Uma pausa para comer algo gostoso em boa companhia.",note:"Celebrar também pode ser reservar um tempo para você."},
 {id:"sorvete",category:"Doces",icon:"🍦",title:"Sorvete favorito",description:"Escolha o sabor que mais te agrada e aproveite.",note:"Sobremesas não são prêmios nem punições."},
 {id:"acai",category:"Doces",icon:"🍧",title:"Açaí com acompanhamentos",description:"Monte a combinação que gosta, de forma tranquila.",note:"Não é necessário compensar esse momento depois."},
 {id:"bolo",category:"Doces",icon:"🍰",title:"Bolo ou sobremesa",description:"Uma fatia de bolo ou uma sobremesa para um momento especial.",note:"Comer com prazer pode fazer parte da rotina."},
 {id:"chocolate",category:"Doces",icon:"🍫",title:"Chocolate que você ama",description:"Escolha seu chocolate favorito e curta a experiência.",note:"Não existe obrigação de merecer um doce."},
 {id:"churrasco",category:"Brasileira",icon:"🥩",title:"Churrasco com amigos",description:"Uma refeição compartilhada, com seus acompanhamentos favoritos.",note:"O encontro e o prazer da comida também importam."},
 {id:"moqueca",category:"Brasileira",icon:"🍲",title:"Moqueca ou peixe",description:"Um almoço especial com os sabores que você mais gosta.",note:"Variedade e satisfação podem caminhar juntas."},
 {id:"tapioca",category:"Brasileira",icon:"🫓",title:"Tapioca recheada",description:"Experimente um recheio diferente ou volte ao seu clássico.",note:"Uma opção prática de acordo com sua vontade."},
 {id:"comida-caseira",category:"Brasileira",icon:"🍛",title:"Almoço caseiro favorito",description:"Arroz, feijão, acompanhamentos e aquele tempero de casa.",note:"Comida cotidiana também merece ser celebrada."},
];

export function foodSuggestions(category:FoodCategory,consistentDays:number,rotation:number):FoodIdea[]{
 const safeRotation=Math.max(0,Math.floor(Number.isFinite(rotation)?rotation:0));
 const favoriteIds=consistentDays>=7?["sushi","risoto","churrasco"]
  :consistentDays>=5?["pizza","hamburguer","sushi"]
  :consistentDays>=3?["sorvete","tapioca","temaki"]
  :["acai","massa","sanduiche"];
 const entries=category==="Todas"?foodIdeas:foodIdeas.filter(food=>food.category===category);
 if(!entries.length)return [];
 if(category!=="Todas"){
  const start=(consistentDays+safeRotation)%entries.length;
  return Array.from({length:Math.min(3,entries.length)},(_,index)=>entries[(start+index)%entries.length]);
 }
 const first=foodIdeas.find(food=>food.id===favoriteIds[safeRotation%favoriteIds.length])??foodIdeas[0];
 const rest=entries.filter(food=>food.id!==first.id);
 const start=(consistentDays*2+safeRotation*3)%rest.length;
 return [first,rest[start],rest[(start+7)%rest.length]];
}
