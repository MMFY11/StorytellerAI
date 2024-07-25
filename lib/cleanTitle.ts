const cleanTitle=(title: string):string =>
     title 
        .replace(/[-/\\[\]]/g,"")
        .replace(/\s+/g,"")
        .trim();


export default cleanTitle;