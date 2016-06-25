htmlToTemplateJson = (function () {
const TAG_TYPE_START = 0;
const TAG_TYPE_END = 1;
const TAG_TYPE_CONTENT = 2;
const TAG_TYPE_SELF_CLOSE = 3;

function Tokenizer(str) {
    const INIT = 0;
    const LESS_THEN = 1;
    const CLOSE_TAG_BEGIN = 2;
    const START_TAG_BEGIN = 3;
    const START_TAG_AFTER_NAME = 4;
    const START_TAG_CLOSED = 5;
    const ATTRIBUTE_NAME_AFTER = 7;
    const ATTRIBUTE_EQUAL_AFTER = 8;
    const CLOSE_TAG_AFTER_NAME = 10;
    const SELF_CLOSE_SLASH = 11;
    const ReNameFinisher = /[\s\\\/>=]/;
    const ReSpace = /\s/m;

    this.content = str;
    this.index = 0;
    this.contentLength = str.length;
    this.status = INIT;
    this.readValue = function (finisher) {
        var start = this.index;
        var cur = this.index;
        var inEscape = false;
        while(cur < this.contentLength) {
            c = this.content[cur];
            if(inEscape) {
                cur++;
                inEscape = false;
            } else if (c == '\\') {
                cur++;
                inEscape = true;
            } else if (finisher && c == finisher) {
                break;
            } else if (!finisher && c.search(ReSpace) == 0) {
                break;
            } else {
                cur++;
            }
        }
        if(finisher) {
            if (cur == this.contentLength) {
                throw "Formatter error, " + this.currentAttributeName + " not finished.";
            }
            this.index  = cur + 1;
        } else {
            this.index = cur;
        }
        var v = this.content.substr(start, cur - start);
        v.replace("\\'", '\'');
        v.replace('\\"', '\"');
        return v;
    }
    
    this.readName = function () {
        var start = this.index;
        var nameLen = this.content.substr(this.index).search(ReNameFinisher);
        if (nameLen < 0) 
            this.index = this.contentLength;
        else
            this.index += nameLen;
        if (nameLen == 0) {
            throw 'invalidate name in ' + this.content.substr(0, this.index) + '|' + this.content.substr(this.index);
        }
        return this.content.substr(start, this.index - start);
    }
    
    this.next = function () {
        this.valueFinisher = "";
        this.tagType = TAG_TYPE_CONTENT;
        this.contentBegin = -1;
        this.tagName = "";
        this.attributes = {};
        this.status = INIT;
        this.currentAttributeName = "";
        while(this.index < this.contentLength) {
            c = str[this.index];
            switch(this.status) {
                case INIT: {
                    switch(c) {
                    case ' ':
                    case '\t':
                    case '\r':
                    case '\n':
                        this.index++;
                        break;
                    case '<':
                        if (this.contentBegin >= 0) {
                            return {type:TAG_TYPE_CONTENT, content:this.content.substr(this.contentBegin, this.index - this.contentBegin - 1), tag:'text'};
                        } else {
                            this.status = LESS_THEN;
                            this.index++;
                        }
                        break;
                    default:
                        if(this.contentBegin < 0)
                            this.contentBegin = this.index;
                        this.tagType = TAG_TYPE_CONTENT;
                        this.index++;
                    }
                    break;
                }
                case LESS_THEN:
                    if(c == '/') {
                        this.status = CLOSE_TAG_BEGIN;
                        this.index++;
                        break;
                    }
                    //follow through
                case CLOSE_TAG_BEGIN: {
                    switch(c) {
                    case '/':
                        throw '// is invalid in html.';
                    case ' ':
                    case '\t':
                    case '\r':
                    case '\n':
                        this.index++;
                        break;
                    default:
                        this.tagName = this.readName.apply(this);
                        if(this.tagName == "") {
                            throw "Tag Name is empty near " + this.index;
                        }
                        if(this.status == LESS_THEN) {
                            this.status = START_TAG_AFTER_NAME;
                        } else {
                            this.status = CLOSE_TAG_AFTER_NAME;
                        }
                        break;
                    }
                    break;
                }
                case START_TAG_AFTER_NAME:{
                    switch(c) {
                    case '/':
                        this.index++;
                        this.status = SELF_CLOSE_SLASH;
                        break;
                    case '>':
                        this.index++;
                        return {type: TAG_TYPE_START, attributes:this.attributes, tag:this.tagName};
                    case ' ':
                    case '\t':
                    case '\r':
                    case '\n':
                        this.index++;
                        break;
                    default:
                        this.currentAttributeName = this.readName.apply(this);
                        this.status = ATTRIBUTE_NAME_AFTER;
                        break;
                    }
                    break;
                }
                case ATTRIBUTE_NAME_AFTER: {
                    switch(c) {
                    case '/':
                        this.index++;
                        this.status = SELF_CLOSE_SLASH;
                        break;
                    case '>':
                        this.attributes.push({name:this.currentAttributeName, value:''});                        
                        this.index++;
                        return {type: TAG_TYPE_START, attributes:this.attributes, tag:this.tagName};
                    case ' ':
                    case '\t':
                    case '\r':
                    case '\n':
                        this.index++;
                        break;
                    case '=':
                        this.index++;
                        this.status = ATTRIBUTE_EQUAL_AFTER;
                        break;
                    default:
                        this.status = START_TAG_AFTER_NAME;
                        break;
                    }
                    break;
                }
                case ATTRIBUTE_EQUAL_AFTER:{
                    switch(c) {
                    case '/':
                        this.index++;
                        this.status = SELF_CLOSE_SLASH;
                        break;
                    case '>':
                        this.attributes[this.currentAttributeName] = '';                        
                        this.index++;
                        return {type: TAG_TYPE_START, attributes:this.attributes, tag:this.tagName};
                    case ' ':
                    case '\t':
                    case '\r':
                    case '\n':
                        this.index++;
                        break;
                    case '\'':
                    case '\"':
                        this.index++;
                        var v = this.readValue(c);
                        this.attributes[this.currentAttributeName] = v;
                        this.currentAttributeName = '';
                        this.status = START_TAG_AFTER_NAME;
                        break;
                    default:
                        var v = this.readValue();
                        this.attributes[this.currentAttributeName] = v;
                        this.currentAttributeName = '';
                        this.status = START_TAG_AFTER_NAME;
                        break;
                    }
                    break;
                }
                case SELF_CLOSE_SLASH: {
                    switch(c) {
                    default:
                        throw "invalid tag, invalidate self close tag";
                    case '>':
                        if (this.currentAttributeName != '')
                            this.attributes[this.currentAttributeName] = '';                        
                        var attrs = this.attributes;
                        this.index++;
                        return {type: TAG_TYPE_SELF_CLOSE, attributes:attrs, tag:this.tagName};
                    } 
                    break;
                }
                case CLOSE_TAG_AFTER_NAME: {
                    switch (c) {
                    case '>':
                        this.index++;
                        return {type: TAG_TYPE_END, tag:this.tagName}
                    case ' ':
                    case '\t':
                    case '\r':
                    case '\n':
                        this.index++;
                        break;
                    default:
                        throw "invalidate close tag.";
                    }
                    break;
                }//case CLOSE_TAG_AFTER_NAME
                default:
                    throw "invalidate status????";
            }//switch status
        }//while
        if(this.index == this.contentLength && this.status == INIT && this.contentBegin >= 0) {
            return {type:TAG_TYPE_CONTENT, content:this.content.substr(this.contentBegin, this.index - this.contentBegin), tag:'text'};
        }
    };
}

function nodeFromToken(token, tag) {
    var node = {type:tag};
    var attr = token['attributes'];
    if(attr.hasOwnProperty('class')) {
        node['classList'] = attr['class'].split(/\s/mg);
        delete attr['class'];
    }
    if(attr.hasOwnProperty('style')) {
        var styleList = attr['style'].split(';');
        node['style'] = {};
        for(var i = 0; i < styleList.length; i++) {
            var nv = styleList[i].split(':');
            if(nv.length == 2)
                node['style'][nv[0]] = nv[1];
        }
        delete attr['style'];
    }
    var events = [];
    for(var k in attr) {
        if(k.length > 2 && k.substr(0, 2) == 'on') {
            events.push(k.substr(2));
            delete attr[k];
        }
    }
    if(events.length > 0) {
        node['events'] = events;
    }
    node['attr'] = attr;
    return node;
}

function addChild(node, c) {
    if(!node.hasOwnProperty('children')) {
       node['children'] = []; 
    }
    node['children'].push(c);
}

function htmlToTemplateJson(str) {
    var tokenizer = new Tokenizer(str);
    var tagStack = [];
    var tagStackTop = -1;
    var token;
    var result = [];
    while(token = tokenizer.next.apply(tokenizer)) {
        var tagName = token['tag'];
        if (tagName) tagName = tagName.toLowerCase();
        if (token['type'] != TAG_TYPE_END 
            && tagStackTop >= 0 && tagStack[tagStackTop]['type'] == 'img') {
            tagStackTop--;
        }
        
        switch(token['type']) {
        case TAG_TYPE_START:
            var node = nodeFromToken(token, tagName);
            if(tagStackTop >= 0) {
                addChild(tagStack[tagStackTop], node);
                tagStack[tagStackTop + 1] = node;
                ++tagStackTop;
            } else {
                tagStack[0] = node;
                tagStackTop = 0;
                result.push(node);
            }
            break;
        case TAG_TYPE_END:
            if (tagStackTop >= 0) {
                if (tagStack[tagStackTop]['type'] == tagName) {
                    tagStackTop--;
                } else {
                    //find corresponding open tag 
                    for(var i = tagStackTop; i >= 0; i--) {
                        if (tagStack[tagStackTop]['type'] == tagName)
                            break;
                    }
                    if (i >= 0) {
                        tagStackTop = i - 1;
                    } else {
                        //ignore this close tag.
                    }
                }
            } else {
                throw 'invalid close tag.';
            }
            break;
        case TAG_TYPE_CONTENT:
            if(tagStackTop >= 0) {
                if(tagStack[tagStackTop]['type'] == 'text')
                    tagStack[tagStackTop]['attr']['value'] = token['content'];
                else
                    addChild(tagStack[tagStackTop], {type:'text', attr:{value:token['content']}});
            } else {
                result.push({type:'text', attr:{value:token['content']}});
            }
            break;
        case TAG_TYPE_SELF_CLOSE:
            var node = nodeFromToken(token, tagName);
            if(tagStackTop >= 0)
                addChild(tagStack[tagStackTop], node);
            else
                result.push(node);
            break;
        }
    }
    return result;
};
return htmlToTemplateJson;
})();