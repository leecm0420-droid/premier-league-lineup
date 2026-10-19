const KO: Record<string, string> = {
  Arsenal: "아스널",
  "Aston Villa": "아스턴 빌라",
  Bournemouth: "본머스",
  Brentford: "브렌트퍼드",
  Brighton: "브라이턴",
  "Brighton and Hove Albion": "브라이턴",
  Burnley: "번리",
  Chelsea: "첼시",
  "Crystal Palace": "크리스탈 팰리스",
  Everton: "에버턴",
  Fulham: "풀럼",
  Leeds: "리즈",
  "Leeds United": "리즈",
  Leicester: "레스터",
  "Leicester City": "레스터",
  Liverpool: "리버풀",
  "Man City": "맨시티",
  "Manchester City": "맨시티",
  "Man Utd": "맨유",
  "Manchester United": "맨유",
  Newcastle: "뉴캐슬",
  "Newcastle United": "뉴캐슬",
  "Nott'm Forest": "노팅엄",
  "Nottingham Forest": "노팅엄",
  Southampton: "사우샘프턴",
  Spurs: "토트넘",
  Tottenham: "토트넘",
  "Tottenham Hotspur": "토트넘",
  Sunderland: "선덜랜드",
  "West Ham": "웨스트햄",
  "West Ham United": "웨스트햄",
  Wolves: "울브스",
  "Wolverhampton Wanderers": "울브스",
  Ipswich: "입스위치",
  "Ipswich Town": "입스위치",
  "Sheffield Utd": "셰필드 유나이티드",
  "Sheffield United": "셰필드 유나이티드",
};

export function teamKo(name: string): string {
  return KO[name] ?? name;
}

export function badgeUrl(code: number): string {
  return `https://resources.premierleague.com/premierleague/badges/70/t${code}.png`;
}
