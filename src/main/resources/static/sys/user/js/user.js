let tableIns;
let tableInsOnLine;
let tree;
layui.use(['element', 'form', 'table', 'layer', 'laydate', 'tree', 'util', 'upload'], function () {
    let table = layui.table;
    let form = layui.form;//select、单选、复选等依赖form
    let element = layui.element; //导航的hover效果、二级菜单等功能，需要依赖element模块
    let laydate = layui.laydate;
    tree = layui.tree;
    let height = document.documentElement.clientHeight - 160;

    //用户列表
    tableIns = table.render({
        elem: '#userTable'
        , url: ctx + '/sys/sysUser/pageList'
        , method: 'POST'
        //请求前参数处理
        , request: {
            pageName: 'page' //页码的参数名称，默认：page
            , limitName: 'rows' //每页数据量的参数名，默认：limit
        }
        , response: {
            statusName: 'flag' //规定数据状态的字段名称，默认：code
            , statusCode: true //规定成功的状态码，默认：0
            , msgName: 'msg' //规定状态信息的字段名称，默认：msg
            , countName: 'records' //规定数据总数的字段名称，默认：count
            , dataName: 'rows' //规定数据列表的字段名称，默认：data
        }
        //响应后数据处理
        , parseData: function (res) { //res 即为原始返回的数据
            var data = res.data;
            return {
                "flag": res.flag, //解析接口状态
                "msg": res.msg, //解析提示文本
                "records": data.records, //解析数据长度
                "rows": data.rows //解析数据列表
            };
        }
        , toolbar: '#userTableToolbarDemo'
        , title: '用户列表'
        , cols: [[
            {field: 'userId', title: 'ID', hide: true}
            , {field: 'img', title: '头像', hide: true}
            , {field: 'userName', title: '姓名'}
            , {field: 'loginName', title: '登录名'}
            , {field: 'roleName', title: '角色'}
            , {field: 'valid', title: '是否允许登录系统（软删除）', hide: true}
            , {field: 'limitMultiLogin', title: '是否允许多人在线', hide: true}
            , {field: 'limitedIp', title: '限制允许登录的IP集合', hide: true}
            , {field: 'expiredTime', title: '账号失效时间', hide: true}
            , {field: 'lastChangePwdTime', title: '最近修改密码时间', hide: true}
            , {field: 'createTime', title: '创建时间', hide: true}
            , {field: 'updateTime', title: '更新时间', hide: true}
            , {fixed: 'right', title: '操作', toolbar: '#userTableBarDemo'}
        ]]
        , defaultToolbar: ['', '', '']
        , page: true
        , height: height
        , cellMinWidth: 80
    });

    //当前在线用户
    tableInsOnLine = table.render({
        elem: '#userOnLineTable'
        , url: ctx + '/sys/sysUser/pageOnLine'
        , method: 'POST'
        //请求前参数处理
        , request: {
            pageName: 'page' //页码的参数名称，默认：page
            , limitName: 'rows' //每页数据量的参数名，默认：limit
        }
        , response: {
            statusName: 'flag' //规定数据状态的字段名称，默认：code
            , statusCode: true //规定成功的状态码，默认：0
            , msgName: 'msg' //规定状态信息的字段名称，默认：msg
            , countName: 'records' //规定数据总数的字段名称，默认：count
            , dataName: 'rows' //规定数据列表的字段名称，默认：data
        }
        //响应后数据处理
        , parseData: function (res) { //res 即为原始返回的数据
            var data = res.data;
            return {
                "flag": res.flag, //解析接口状态
                "msg": res.msg, //解析提示文本
                "records": data.records, //解析数据长度
                "rows": data.rows //解析数据列表
            };
        }
        , toolbar: '#userOnLineTableToolbarDemo'
        , title: '当前在线用户'
        , cols: [[
            {field: 'loginName', title: '', hide: true}
            , {field: 'loginName', title: '登录名'}
            , {fixed: 'right', title: '操作', toolbar: '#userOnLineTableBarDemo'}
        ]]
        , defaultToolbar: ['', '', '']
        , height: height
        , cellMinWidth: 80
    });

    //头工具栏事件
    table.on('toolbar(test)', function (obj) {
        switch (obj.event) {
            case 'addData':
                layui.use(['layer'], function () {
                    var layer = layui.layer, $ = layui.$;
                    layer.open({
                        type: 1,
                        title: "新增用户",
                        area: ['60%', '80%'],
                        content: $('#addUser'),
                        scrollbar: false,
                        end: function () {
                            location.reload();  //关闭弹窗后刷新
                        }
                    });
                });

                //重置操作表单
                $("#userForm")[0].reset();
                let nowTime = commonUtil.getNowTime();
                $("input[name='createTime']").val(nowTime);
                $("input[name='updateTime']").val(nowTime);
                $("input[name='lastChangePwdTime']").val(nowTime);

                $("input[name='loginName']").removeAttr("readonly");

                form.render();
                loadMenuTree();
                loadAuthorityTree();
                break;
            case 'query':
                let queryByLoginName = $("#queryByLoginName").val();
                let query = {
                    page: {
                        curr: 1 //重新从第 1 页开始
                    }
                    , done: function (res, curr, count) {
                        //完成后重置where，解决下一次请求携带旧数据
                        // this.where = {};
                    }
                };
                if (!queryByLoginName) {
                    queryByLoginName = "";
                }
                //设定异步数据接口的额外参数
                query.where = {loginName: queryByLoginName};
                tableIns.reload(query);
                $("#queryByLoginName").val(queryByLoginName);
                break;
            case 'reload':
                tableInsOnLine.reload();
                break;
        }
    });

    //监听行工具事件
    table.on('tool(test)', function (obj) {
        let data = obj.data;
        //删除
        if (obj.event === 'del') {
            layer.confirm('确认删除吗？', function (index) {
                //向服务端发送删除指令
                $.delete(ctx + "/sys/sysUser/delete/" + data.userId, {}, function (data) {
                    tableIns.reload();
                    layer.close(index);
                })
            });
        }
        //编辑
        else if (obj.event === 'edit') {
            layui.use(['layer'], function () {
                var layer = layui.layer, $ = layui.$;
                layer.open({
                    type: 1,
                    title: "导入",
                    area: ['60%', '80%'],
                    content: $('#addUser'),
                    scrollbar: false,
                    end: function () {
                        location.reload();  //关闭弹窗后刷新
                    }
                });
            });
            //回显操作表单
            console.log(data);
            $("#userForm").form(data);
            $("input[name='loginName']").attr("readonly", "readonly");

            form.render();
            $('#demo1').attr('src', data.img);
            loadMenuTree();
            loadAuthorityTree();
        }
        //踢下线
        else if (obj.event === 'forced') {
            layer.confirm('确认强制该用户下线吗？', function (index) {
                //向服务端发送删除指令
                $.delete(ctx + "/sys/sysUser/forced/" + data.loginName, {}, function (data) {
                    tableInsOnLine.reload();
                    layer.close(index);
                })
            });
        }
    });

    //日期选择器
    laydate.render({
        elem: '#expiredTimeDate',
        format: "yyyy-MM-dd",
        type: 'date'
    });


    var $ = layui.jquery, upload = layui.upload;
    var uploadInst = upload.render({
        elem: '#test1'
        , url: ctx + "/sys/sysUser/uploadImage" //改成您自己的上传接口
        , accept: 'image'
        , exts: 'jpeg|png|jpg'
        , size: 500 //限制文件大小，单位 KB
        , before: function (obj) {
            //预读本地文件示例，不支持ie8
            obj.preview(function (index, file, result) {
                $('#demo1').attr('src', result); //图片链接（base64）
            });
        }
        , done: function (res) {
            //如果上传失败
            if (res.code > 0) {
                return layer.msg('上传失败');
            }
            //上传成功
            $('#img').val(res.imageUrl);
            $('#demoText').html('<span style="color: #0CB7F5;">上传成功</span>');
        }
        , error: function () {
            //演示失败状态，并实现重传
            var demoText = $('#demoText');
            demoText.html('<span style="color: #FF5722;">上传失败</span> <a class="layui-btn layui-btn-xs demo-reload">重试</a>');
            demoText.find('.demo-reload').on('click', function () {
                uploadInst.upload();
            });
        }
    });
});

/**
 * 提交保存
 */
function userFormSave() {
    let userForm = $("#userForm").serializeObject();
    userForm.updateTime = commonUtil.getNowTime();
    $.post(ctx + "/sys/sysUser/save", userForm, function (data) {

        if(!data.flag){
            layer.msg(data.msg, {icon: 2,time: 2000}, function () {});
            return;
        }

        //保存用户菜单跟用户权限,只要userId，以及Id集合就可以了
        let menuIdList = [];
        for (let check of tree.getChecked('userMenuTree')[0].children) {
            menuIdList.push(check.id);
            if (check.children && check.children.length > 0) {
                for (let check1 of check.children) {
                    menuIdList.push(check1.id);
                }
            }
        }
        let postData = {
            userId: data.data.userId,
            menuIdList: menuIdList.join(",")
        };
        $.post(ctx + "/sys/sysUserMenu/saveAllByUserId", postData, function (data) {});

        let authorityIdList = [];
        for (let check of tree.getChecked('userAuthorityTree')[0].children) {
            authorityIdList.push(check.id);
        }
        let postData2 = {
            userId: data.data.userId,
            authorityIdList: authorityIdList.join(",")
        };
        $.post(ctx + "/sys/sysUserAuthority/saveAllByUserId", postData2, function (data) {});

        layer.msg("保存成功", {icon: 1, time: 2000}, function () {});

        //更新table、updateTime
        $("input[name='updateTime']").val(userForm.updateTime);
        tableIns.reload();
    });
}

/**
 * 提交保存
 */
function register() {
    let userForm = $("#registerForm").serializeObject();
    $.post(ctx + "/sys/sysUser/register", userForm, function (data) {

        if (!data.flag) {
            layer.msg(data.msg, {icon: 2, time: 2000}, function () {
            });
            return;
        }

        layer.msg("保存成功", {icon: 1, time: 2000}, function () {
        });

        window.location.href = ctx + "/loginPage";
    });
}

/**
 * 重置密码
 */
function resetPassword() {
    let userForm = $("#userForm").serializeObject();
    if (userForm.userId === "") {
        layer.msg("新增用户无需点这个按钮，如需重置请先选择需要重置的用户！", {icon: 2, time: 2000}, function () {
        });
        return;
    }

    layer.confirm('确认重置该用户的密码吗？', function (index) {
        $.post(ctx + "/sys/sysUser/resetPassword", userForm, function (data) {
            if (data.flag) {
                layer.msg("密码重置成功，请尽快通知用户登录系统修改密码！", {icon: 1, time: 2000}, function () {
                });
            }
            layer.close(index);
        });
    });
}

/**
 * 加载用户菜单
 */
function loadMenuTree() {
    let userForm = $("#userForm").serializeObject();
    //获取菜单数据
    $.post(ctx + "/sys/sysUserMenu/findUserMenuAndAllSysMenuByUserId", userForm, function (data) {
        //数据说明：id对应id，title对应menuName，href对应menuPath
        let treeData = commonUtil.updateKeyForLayuiTree(data.data.sysMenuVoList);

        //回显用户菜单
        treeData = commonUtil.checkedForLayuiTree(treeData, JSON.stringify(data.data.userSysMenuVoList));

        //开启节点操作图标
        tree.render({
            elem: '#userMenuTree'
            , id: 'userMenuTree'
            , data: [{
                title: '系统菜单根节点'
                , href: "/"
                , id: 0
                , spread: true
                , children: treeData
            }]
            , showCheckbox: true
        });
    });
}

/**
 * 加载用户权限
 */
function loadAuthorityTree() {
    let userForm = $("#userForm").serializeObject();
    //获取菜单数据
    $.post(ctx + "/sys/sysUserAuthority/findUserAuthorityAndAllSysAuthorityByUserId", userForm, function (data) {
        //数据说明：id对应id，title对应menuName，href对应menuPath
        let treeData = [];
        let userTreeString = JSON.stringify(data.data.sysUserAuthorityVoList);
        for (let authority of data.data.sysAuthorityVoList) {
            let tree = {
                title: authority.authorityName
                , id: authority.authorityId
                , spread: true
            };
            //回显用户权限
            if (userTreeString.search(authority.authorityId) !== -1) {
                tree.checked = true;
            }
            treeData.push(tree);
        }

        //开启节点操作图标
        tree.render({
            elem: '#userAuthorityTree'
            , id: 'userAuthorityTree'
            , data: [{
                title: '系统权限根节点'
                , href: "/"
                , id: 0
                , spread: true
                , children: treeData
            }]
            , showCheckbox: true
        });
    });
}