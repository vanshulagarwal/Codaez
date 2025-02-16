class ApiFeatures{
    constructor(query,querystr){
        this.query=query;
        this.querystr=querystr;
    }
    search(){
        const keyword=this.querystr.keyword
        ? {
            $or: [
                { username: { $regex: this.querystr.keyword, $options: "i" } },
                { name: { $regex: this.querystr.keyword, $options: "i" } }
            ]
        } 
        : {};

        // console.log(keyword);
        this.query=this.query.find({...keyword});
        return this;
    }
}

module.exports=ApiFeatures;