import { tacoFoods, type TacoFood } from "./taco";

export type FoodPortion={foodId:number;grams:number};
export const tacoFoodById=new Map<number,TacoFood>(tacoFoods.map(f=>[f.id,f]));

export function nutrientForGrams(per100g:number|null,grams:number):number|null{
 if(per100g===null||!Number.isFinite(grams)||grams<=0)return null;
 return per100g*grams/100;
}

export function mealNutrition(portions:FoodPortion[]|undefined){
 let kcal=0,protein=0,carbs=0,fat=0,missingKcal=false,missingMacros=false,totalGrams=0;
 for(const portion of portions??[]){
  const food=tacoFoodById.get(portion.foodId);
  if(!food||!Number.isFinite(portion.grams)||portion.grams<=0){missingKcal=true;missingMacros=true;continue}
  totalGrams+=portion.grams;
  const energy=nutrientForGrams(food.kcal,portion.grams);
  if(energy===null)missingKcal=true;else kcal+=energy;
  const p=nutrientForGrams(food.protein,portion.grams);
  const c=nutrientForGrams(food.carbs,portion.grams);
  const f=nutrientForGrams(food.fat,portion.grams);
  if(p===null||c===null||f===null)missingMacros=true;
  protein+=p??0;carbs+=c??0;fat+=f??0;
 }
 return {kcal,protein,carbs,fat,missingKcal,missingMacros,totalGrams,hasFoods:(portions?.length??0)>0};
}
export const ptNumber=(value:number,digits=1)=>new Intl.NumberFormat("pt-BR",{maximumFractionDigits:digits}).format(value);
