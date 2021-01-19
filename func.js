(function (js_body) {
    // 脱壳 && 解密
    let js_arr = js_body.split("\n").pop().split(';'),
        fun_name = /var\s+(_0x[a-z0-9]+)=/.exec(js_arr[6])[1],
        reg_str = fun_name + '\\(' + "'([^']+)',\s*'([^']+)'" + '\\)',
        js_str = js_arr.slice(54, js_arr.length - 4).join(';'),
        code_shell = js_arr.slice(0, 54).join(';'),
        shell_obj = eval("(function(){" + code_shell + ";return " + fun_name + "})()");
    js_str = js_str.replace(new RegExp(reg_str, 'g'), function (str, id, key) {
        return '"' + shell_obj(id, key) + '"';
    }).replace(/([a-z0-9\-_A-Z)\]]+)\s?\[["']([^"']+)["']\]/g, '$1.$2').replace(/(?<!_)(0x[0-9a-f]+)/g, function (hex) {
        return parseInt(hex).toString();
    });
    // 还原混淆
    let obj = null, name = '';
    js_str = js_str.replace(/{(var\s+(_0x[0-9a-z]+)=(\{(.*)\}));/g, function (str, code_str, _name, obj_str) {
        obj = eval("(function () {return " + obj_str + "})()");
        name = _name;
        return '{';
    });
    if (obj) {
        let i = 5;
        while (js_str.indexOf(name) && --i > 0) {
            for (const key in obj) {
                if (!obj.hasOwnProperty(key)) continue;
                if (typeof obj[key] == 'function') {
                    let fun_info = /function\s*_0x[0-9a-z]+\(([^)]*)\){return\s*([^;]+);}/.exec(obj[key].toString());
                    js_str = js_str.replace(new RegExp(name + '\\.' + key + '\\(([^())]*)\\)', 'g'), function (string, args_str) {
                        let args = args_str.split(','),
                            fun_args = fun_info[1].split(','),
                            fun_body = fun_info[2];
                        fun_args.forEach(function (item, index) {
                            fun_body = fun_body.replace(item, args[index]);
                        });
                        return fun_body;
                    });
                } else if (typeof obj[key] == 'string') {
                    js_str = js_str.replace(name + '.' + key, '"' + obj[key] + '"');
                } else {
                    js_str = js_str.replace(name + '.' + key, obj[key].toString());
                }
            }
        }
    }
    return js_str;
})
($('#source').val() || $('#jsdata').val());
