"use client";

import { useMemo, useState } from "react";
import { tacoFoods } from "../lib/taco";
import { type FoodPortion, tacoFoodById, mealNutrition, ptNumber, nutrientForGrams } from "../lib/nutrition";

type Props={value:FoodPortion[];onChange:(items:FoodPortion[])=>void};
const normalize=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const categories=Array.from(new Set(tacoFoods.map(f=>f.category))).sort((a,b)=>a.localeCompare(b,"pt-BR"));

export default function NutritionPicker({value,onChange}:Props){
 const [search,setSearch]=useState("");
 const [category,setCategory]=useState("");
 const [newGrams,setNewGrams]=useState("100");
 const [activeFood,setActiveFood]=useState<number|null>(null);
 const results=useMemo(()=>{
  const q=normalize(search.trim());
  return tacoFoods
   .filter(food=>(!category||food.category===category)&&(!q||normalize(food.name).includes(q)))
   .slice(0,30);
 },[search,category]);
 const selected=tacoFoodById.get(activeFood??-1);
 const grams=Number(newGrams);
 const canAdd=selected&&Number.isFinite(grams)&&grams>0&&grams<=3000;
 const nutrition=mealNutrition(value);
 const add=()=>{
  if(!canAdd||!selected)return;
  const existing=value.findIndex(item=>item.foodId===selected.id);
  if(existing!==-1){
   onChange(value.map((item,i)=>i===existing?{...item,grams:Math.min(3000,item.grams+grams)}:item));
  }else{onChange([...value,{foodId:selected.id,grams}])}
  setActiveFood(null);setSearch("");setNewGrams("100");
 };
 const updateGrams=(index:number,newValue:number)=>{
  onChange(value.map((item,i)=>i===index?{...item,grams:newValue}:item));
 };
 return <div className="taco-picker">
  <div className="taco-picker-header">
   <div><b>Tabela TACO — alimentos</b><span>Escolha os alimentos e informe o peso da parte comestível em gramas.</span></div>
   <span className="taco-count">{tacoFoods.length} alimentos</span>
  </div>
  <div className="taco-filters">
   <label>Pesquisar alimento
    <input type="search" value={search} onKeyDown={e=>{if(e.key==="Enter")e.preventDefault()}} onChange={e=>{setSearch(e.target.value);setActiveFood(null)}} placeholder="Ex.: arroz, frango, banana..." />
   </label>
   <label>Categoria
    <select value={category} onChange={e=>{setCategory(e.target.value);setActiveFood(null)}}>
     <option value="">Todas</option>
     {categories.map(c=><option key={c} value={c}>{c}</option>)}
    </select>
   </label>
  </div>
  <div className="taco-results" role="listbox" aria-label="Alimentos encontrados">
   {results.length===0?<p className="taco-no-results">Nenhum alimento encontrado. Tente outra descrição.</p>:
   results.map(food=><button type="button" role="option" aria-selected={food.id===activeFood} className={food.id===activeFood?"taco-result chosen":"taco-result"} key={food.id} onClick={()=>setActiveFood(food.id)}>
    <span>{food.name}<small>{food.category}</small></span>
    <strong>{food.kcal===null?"Sem dado":ptNumber(food.kcal)+" kcal"}<small>por 100 g</small></strong>
   </button>)}
  </div>
  {selected&&<div className="taco-selection">
    <div><b>{selected.name}</b><small>{selected.kcal===null?"Energia não analisada na TACO":ptNumber(selected.kcal)+" kcal a cada 100 g"}</small></div>
    <label>Quantidade (g)
     <input type="number" min="0.1" max="3000" step="0.1" inputMode="decimal" value={newGrams} onChange={e=>setNewGrams(e.target.value)}/>
    </label>
    <div className="taco-preview">
     <span>Calorias da porção</span>
     <strong>{canAdd&&selected.kcal!==null?ptNumber(nutrientForGrams(selected.kcal,grams)??0)+" kcal":"Indisponível"}</strong>
    </div>
    <button type="button" className="primary" onClick={add} disabled={!canAdd}>+ Adicionar alimento</button>
   </div>}
  <div className="taco-added">
   <div className="taco-added-title"><h3>Alimentos desta refeição</h3><span>{value.length} {value.length===1?"item":"itens"}</span></div>
   {value.length===0?<p className="taco-empty">Nenhum alimento selecionado. A descrição livre da refeição não entra no cálculo.</p>:
    value.map((portion,i)=>{
     const food=tacoFoodById.get(portion.foodId);
     const kcal=food?nutrientForGrams(food.kcal,portion.grams):null;
     return <div className="taco-added-row" key={portion.foodId+"-"+i}>
      <span className="taco-added-name">{food?.name??"Alimento não encontrado"}</span>
      <label>Gramas
       <input aria-label={"Gramas de "+(food?.name??"alimento")} type="number" inputMode="decimal" min="0.1" max="3000" step="0.1"
        value={portion.grams||""} onChange={e=>updateGrams(i,Number(e.target.value))} onBlur={()=>{if(portion.grams<=0||portion.grams>3000)updateGrams(i,100)}} />
      </label>
      <strong>{kcal===null?"—":ptNumber(kcal)+" kcal"}</strong>
      <button type="button" aria-label={"Remover "+(food?.name??"alimento")} className="taco-remove" onClick={()=>onChange(value.filter((_,j)=>i!==j))}>×</button>
     </div>
    })}
   <div className="taco-totals">
    <div><span>Energia estimada</span><strong>{nutrition.hasFoods?(nutrition.missingKcal?"Incompleta":ptNumber(nutrition.kcal)+" kcal"):"—"}</strong></div>
    {nutrition.hasFoods&&<div className="taco-macros">
     <span>Proteínas: {ptNumber(nutrition.protein)} g</span>
     <span>Carboidratos: {ptNumber(nutrition.carbs)} g</span>
     <span>Gorduras: {ptNumber(nutrition.fat)} g</span>
    </div>}
    {nutrition.missingKcal&&<p className="taco-warning">Um alimento está sem valor energético na TACO. O total não pode ser calculado integralmente.</p>}
    {nutrition.missingMacros&&<p className="taco-warning">Há macronutrientes sem dados publicados para pelo menos um alimento.</p>}
    {value.some(v=>v.grams<=0||v.grams>3000)&&<p className="taco-warning">Corrija as quantidades para valores entre 0,1 g e 3.000 g.</p>}
   </div>
  </div>
  <p className="taco-source">Fonte: NEPA/UNICAMP, TACO — 4ª edição (2011). Valores por 100 g de parte comestível. Selecione o preparo correto (cru, cozido, assado etc.). Valores médios, sujeitos a variações. <a href="https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/" target="_blank" rel="noopener noreferrer">Consultar fonte</a>.</p>
 </div>;
}
