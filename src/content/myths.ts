export interface MythSource {
  title: string;
  url: string;
  supports: string;
}

export interface MythCard {
  id: string;
  claim: string;
  verdict: "myth" | "fact" | "qualified";
  cardCopy: string;
  sources: MythSource[];
}

export const mythCards: MythCard[] = [
  {
    id: "meal-skip",
    claim: "Skipping dinner resets your metabolism?",
    verdict: "myth",
    cardCopy: "Skipping dinner does not reset metabolism. Short studies show changes in fuel use, not evidence of a lasting metabolic reset.",
    sources: [
      { title: "Impact of breakfast skipping compared with dinner skipping on regulation of energy balance and metabolic risk", url: "https://www.sciencedirect.com/science/article/pii/S0002916522049085", supports: "A small randomized crossover study found no lower 24-hour energy expenditure from skipping dinner on the test day; it does not establish a lasting reset." },
      { title: "Early Time-Restricted Feeding Reduces Appetite and Increases Fat Oxidation but Does Not Affect Energy Expenditure in Humans", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6658129/", supports: "A short feeding study found no significant change in 24-hour or resting energy expenditure, while some short-term fuel-use measures changed." },
    ],
  },
  {
    id: "willpower",
    claim: "Weight is mostly willpower?",
    verdict: "myth",
    cardCopy: "Body weight is not simply a matter of willpower. Biology, habits, social conditions and surroundings all play a part; no single factor explains everyone.",
    sources: [
      { title: "WHO: Obesity and overweight", url: "https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight", supports: "Describes obesity as shaped by interacting environmental, social, biological and behavioural determinants." },
      { title: "NHLBI: Overweight and Obesity Causes and Risk Factors", url: "https://www.nhlbi.nih.gov/health/overweight-and-obesity/causes", supports: "Lists genetics, sleep, health conditions, behaviours and environmental factors among influences on weight." },
      { title: "Endotext: Social and Environmental Factors Influencing Obesity", url: "https://www.ncbi.nlm.nih.gov/books/NBK278977/", supports: "Reviews social and environmental contributors, including food availability, socioeconomic conditions and neighbourhood factors." },
    ],
  },
  {
    id: "after-meal-walk",
    claim: "A 10-minute walk after meals can soften the blood-sugar rise.",
    verdict: "qualified",
    cardCopy: "A brief walk after a meal may reduce the blood-sugar rise for some people. Evidence for exactly ten minutes is limited.",
    sources: [
      { title: "Positive impact of a 10-min walk immediately after glucose intake on postprandial glucose levels", url: "https://www.nature.com/articles/s41598-025-07312-y", supports: "A small trial found lower glucose measures after a 10-minute walk following a glucose drink; the sample and setting limit generalization to meals." },
      { title: "After Dinner Rest a While, After Supper Walk a Mile? A Systematic Review with Meta-analysis on the Acute Postprandial Glycemic Response to Exercise", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10036272/", supports: "A review of crossover trials found post-meal exercise reduced glucose excursions versus inactivity or pre-meal exercise, with limitations in the underlying evidence." },
    ],
  },
  {
    id: "carbs-glucose",
    claim: "Only sweets raise blood sugar?",
    verdict: "myth",
    cardCopy: "Sweets aren’t the only foods that can raise blood sugar. Rice, roti, potatoes and grains can too. Foods differ; there’s no need to avoid them all.",
    sources: [
      { title: "CDC: Carb Counting", url: "https://www.cdc.gov/diabetes/healthy-eating/carb-counting-manage-blood-sugar.html", supports: "Explains that both sugars and starches raise blood sugar and identifies grains and potatoes as starchy foods." },
      { title: "American Diabetes Association: Understanding Carbs", url: "https://diabetes.org/food-nutrition/understanding-carbs", supports: "Explains that carbohydrate foods break down into glucose and includes rice, whole-wheat bread and starchy vegetables." },
      { title: "NHS: Starchy Foods and Carbohydrates", url: "https://www.nhs.uk/live-well/eat-well/food-types/starchy-foods-and-carbohydrates/", supports: "Identifies potatoes, bread and rice as starchy foods that can be part of a balanced diet." },
    ],
  },
  {
    id: "diabetes-only",
    claim: "Metabolic problems only affect people with diabetes?",
    verdict: "myth",
    cardCopy: "No. Prediabetes and other cardiometabolic risk factors can be present before diabetes is diagnosed. This isn’t a diagnosis of anyone’s health.",
    sources: [
      { title: "NIDDK: Insulin Resistance & Prediabetes", url: "https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes/prediabetes-insulin-resistance", supports: "Defines prediabetes as glucose above normal but below the diabetes threshold and describes insulin resistance and associated conditions." },
      { title: "Prediabetes and Cardiovascular Disease: Pathophysiology and Interventions", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5806140/", supports: "Reviews evidence that cardiovascular risk factors can begin before clinical diabetes." },
      { title: "ICMR-INDIAB-17: Metabolic non-communicable disease health report of India", url: "https://pubmed.ncbi.nlm.nih.gov/37301218/", supports: "Reports prediabetes as distinct from diabetes and separately measures cardiometabolic conditions including hypertension and dyslipidaemia in India." },
    ],
  },
  {
    id: "sleep-appetite",
    claim: "Poor sleep can make you hungrier the next day.",
    verdict: "qualified",
    cardCopy: "A short night may leave some people feeling hungrier or eating more the next day. Effects vary, and not everyone notices a change.",
    sources: [
      { title: "A Systematic Review and Meta-Analysis of Randomized Controlled Trials of the Impact of Sleep Duration on Adiposity and Components of Energy Balance", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4532553/", supports: "Reports increased hunger and food intake in several sleep-restriction experiments while noting study variation and inconsistent appetite-hormone findings." },
      { title: "A single night of moderate sleep restriction at-home increases hunger and food intake in overweight young adults", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9991999/", supports: "A small study observed greater hunger and food intake after one night of moderate sleep restriction; the sample and design limit generalization." },
    ],
  },
  {
    id: "muscle-loss",
    claim: "Weight loss is only fat loss?",
    verdict: "myth",
    cardCopy: "Weight loss can reduce fat and lean tissue—not just fat. Resistance exercise and enough protein may help preserve muscle, but results vary.",
    sources: [
      { title: "Preserving Healthy Muscle during Weight Loss", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5421125/", supports: "Reviews evidence that diet-induced weight loss can reduce muscle mass and that protein and physical activity, especially resistance exercise, may help preserve it." },
      { title: "Effect of resistance exercise on body composition, muscle strength and cardiometabolic health during dietary weight loss", url: "https://bmjopensem.bmj.com/content/11/3/e002363", supports: "A systematic review and meta-analysis reports reductions in both fat and fat-free mass during dietary weight loss, with resistance exercise helping protect fat-free mass." },
    ],
  },
  {
    id: "detox-drink",
    claim: "A detox drink resets your metabolism?",
    verdict: "myth",
    cardCopy: "What you eat can affect health, but no specific drink has been shown to reset metabolism or detoxify your body.",
    sources: [
      { title: "British Dietetic Association: Detox Diets", url: "https://www.bda.uk.com/resource/detox-diets.html", supports: "Explains that the body continually processes and removes waste and that no specific drink has been shown to provide a special detox effect." },
      { title: "NCCIH: ‘Detoxes’ and ‘Cleanses’: What You Need To Know", url: "https://www.nccih.nih.gov/health/detoxes-and-cleanses-what-you-need-to-know", supports: "Reports no compelling research that detox diets remove toxins and notes that some cleanses can carry risks." },
      { title: "Detox diets for toxin elimination and weight management: a critical review of the evidence", url: "https://pubmed.ncbi.nlm.nih.gov/25522674/", supports: "A review found little clinical evidence for detox diets and no randomized controlled trials of commercial detox diets in humans at the time of review." },
    ],
  },
  {
    id: "whole-fruit",
    claim: "Fruit juice is the same as whole fruit?",
    verdict: "myth",
    cardCopy: "Juice usually has less fibre and is easier to drink in larger portions. It can affect blood sugar differently, but whole fruit remains a healthy choice.",
    sources: [
      { title: "WHO: Healthy diet", url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet", supports: "Recommends fruit as a carbohydrate source and notes that most fruit juices contain significant free sugars; it also emphasizes dietary fibre." },
      { title: "NHS: 5 A Day: what counts?", url: "https://www.nhs.uk/live-well/eat-well/5-a-day/5-a-day-what-counts/", supports: "Distinguishes whole-fruit portions from a capped 150 ml daily portion of juice or smoothies, noting that juice is easy to consume in excess." },
      { title: "Whole Fruits Versus 100% Fruit Juice: Revisiting the Evidence", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12398644/", supports: "Reviews fibre, satiety and glucose-response differences between whole fruit and juice and supports cautious, non-absolute phrasing." },
    ],
  },
  {
    id: "fasting",
    claim: "Intermittent fasting is necessary for metabolic health?",
    verdict: "myth",
    cardCopy: "Fasting is one way to time meals, not a requirement for metabolic health. Studies have not shown it to be superior to every other approach.",
    sources: [
      { title: "Is isocaloric intermittent fasting superior to calorie restriction? A systematic review and meta-analysis of RCTs", url: "https://pubmed.ncbi.nlm.nih.gov/39732588/", supports: "A meta-analysis of 20 randomized trials concluded intermittent fasting may be an alternative to calorie restriction but was not superior overall; long-term evidence remains limited." },
      { title: "Intermittent Fasting and Metabolic Health", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7419159/", supports: "Reviews possible benefits, comparable outcomes in some comparisons and heterogeneity in responses." },
      { title: "Time-restricted eating for metabolic syndrome", url: "https://www.nih.gov/news-events/nih-research-matters/time-restricted-eating-metabolic-syndrome", supports: "Summarizes a small trial and notes that longer studies are needed." },
    ],
  },
];
