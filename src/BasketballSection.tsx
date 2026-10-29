import { ArrowUpRight, Download, Trophy, Flag, Dribbble } from 'lucide-react';
import './basketball.css';

const honors = [
 { year: '2026', title: 'Vainqueur de la Coupe du Trône', club: 'MAS de Fès' },
 { year: '2025', title: 'Champion du Maroc U19', club: 'MAS de Fès' },
 { year: '2025', title: 'Champion du Maroc de 2e division', club: 'MAS B' },
];

export default function BasketballSection(){
 return <section id="basket" className="section basketball">
  <div className="section-label"><span>06 / AU-DELÀ DU CODE</span><small>Le collectif, sur le terrain aussi</small></div>
  <div className="basket-intro">
   <div><p className="basket-eyebrow"><Dribbble size={17} aria-hidden="true"/> BASKETBALL · MAS DE FÈS</p><h2>Le même engagement.<br/><em>Un autre terrain.</em></h2></div>
   <div className="basket-position"><strong>Meneur / Arrière</strong><span>PG / SG · 1,87 m</span><p>Joueur marocain formé à Fès, j’évolue au MAS de Fès depuis 2024, des catégories jeunes au niveau senior. Le tir extérieur, la création et la lecture du jeu sont au cœur de mon profil.</p></div>
  </div>
  <div className="basket-honors" aria-label="Palmarès sportif">{honors.map(h=><article key={h.title}><div className="basket-honor-top"><span>{h.year}</span><Trophy size={21} aria-hidden="true"/></div><h3>{h.title}</h3><p>{h.club}</p></article>)}</div>
  <div className="basket-details">
   <div className="basket-career"><h3>Mon parcours sportif</h3><div className="basket-career-item"><span>DEPUIS 2024</span><div><h4>MAS de Fès</h4><p>Championnat national U19 et compétitions seniors avec MAS B en première division marocaine. Participation à la Coupe du Trône.</p></div></div><div className="basket-career-item"><span>JUSQU’EN 2024</span><div><h4>Nejme Fès</h4><p>Formation dès les catégories jeunes et progression au sein du club.</p></div></div></div>
   <div className="basket-national"><div className="basket-national-label"><Flag size={18} aria-hidden="true"/><span>SÉLECTIONS NATIONALES</span></div><h3>Porter les couleurs<br/><em>du Maroc.</em></h3><div className="basket-national-chips"><span>U16</span><span>U17</span></div><p>Deux sélections en équipe nationale marocaine dans les catégories jeunes.</p></div>
  </div>
  <div className="basket-goal"><div><span className="basket-eyebrow">PROJET SPORTIF & ACADÉMIQUE</span><h3>Continuer à progresser, sur les deux terrains.</h3><p>Intégrer en France un club, une université ou une structure sport-études pour poursuivre le basketball à un niveau compétitif tout en continuant mes études d’ingénierie informatique.</p></div><div className="basket-actions"><a className="button primary" href="https://vt.tiktok.com/ZSqsNWmbQ/" target="_blank" rel="noopener noreferrer">Voir mes highlights <ArrowUpRight size={17}/></a><a className="text-link" href="/cv-basketball-yassine-faraj.pdf" target="_blank" rel="noopener noreferrer"><Download size={16}/> Mon CV sportif</a></div></div>
  <p className="basket-contact">Échanger sur mon parcours sportif <a href="mailto:farajy240@gmail.com">farajy240@gmail.com <ArrowUpRight size={14}/></a></p>
 </section>;
}
