function sendRequest(action, params, callback){
    chrome.extension.sendRequest({action: action, params: params}, callback);
}

var settings;

sendRequest('get_settings', null, function(response){
    if (response.status == 'ok' && response.data){
        settings = response.data;
    }
});

$(".items_wrapper .item").each(function(index) {
    var task_id = $(this)
        .attr('id')
        .replace('show_item_', '')
        .trim();

    addLabel(task_id);
});

$('.superlabel .item_label').live('click', function(e) {
    var this_label = $(this).parent();
    var labels = getDefaultLabels();
    $('.superlabel .list ').remove();

    this_label.append('<ul class="list"></ul>');

    var this_list = $('.list', this_label);

    this_list.append('<li class="empty"><a class="clear">clear</a></ul>');

    $.each(labels, function(index, value) {
        this_list.append('<li><a>' + $.trim(value) + '</a></ul>');
    });

    this_list.append('<li><a class="hide_labels_list">cancel</a></li></ul>');
});


$('.superlabel li a').live('click', function(e) {

    var this_link = $(this);

    if (this_link.hasClass('hide_labels_list')) {
        $('.superlabel .list ').remove();
        return false;
    }

    var task_id = this_link.parents('.item').attr('id').replace('show_item_', '').trim();

    if (this_link.hasClass('post_new_comment')) {

        label_text =  this_link.data('label_text');
        addNewComment(task_id, label_text);

        $('.superlabel .list ').remove();
        return false;
    }

    if (this_link.hasClass('clear')) {
        changeLabel(task_id, '', '');
        return false;
    } else {
        changeLabel(task_id, this_link.text(), this_link.text().toLowerCase().replace(/ /g, "-"));
        return false;
    }

    return false;
});

$('.items_wrapper').live('DOMNodeInserted', function(e) {
    var task_id = '';
    if (e.target.tagName == 'SPAN') { //rename item
        task_id = $(e.target).parents('.item').attr('id').replace('show_item_', '').trim();
        addLabel(task_id);
    }
    if ($(e.target).hasClass('item_wrapper')) {	//move, add, recovery item
        task_id = $(e.target).attr('id').replace('item_', '').trim();
        addLabel(task_id);
    }
});

function addLabel(task_id) {

    if (! $('#item_' + task_id + '_content').children('.superlabel').size()) {

        var task_text = $('#item_wrap_' + task_id).text();
        var label_text = getWordsBetweenCurlies(task_text);

        if (label_text) {
            label_class = label_text.toLowerCase().replace(/ /g, "-");
            $('#item_wrap_' + task_id).text($.trim(task_text.replace('{' + label_text + '}', '')))
            $('#item_' + task_id + '_content').prepend('<i class="superlabel ' + label_class + '"><span class="item_label">' + label_text + '</span></i>');
        } else {
            $('#item_' + task_id + '_content').prepend('<i class="superlabel empty"><span class="item_label">&nbsp;&nbsp;</span></i>');
        }
    }
}

function changeLabel(task_id, label_text, label_class) {
    var current_task = $('#item_' + task_id + '_content');

    if (current_task.size()) {
        var task_text = $('#item_wrap_' + task_id).text();
        current_task.children('.superlabel').remove();
        if (label_text == '') {
            $('#item_' + task_id + '_content').prepend('<i class="superlabel empty"><span class="item_label">&nbsp;&nbsp;</span></i>');

        } else {
            if (label_class == '') {
                label_class = label_text.toLowerCase().replace(/ /g, "-");
            }
            task_text =  "{" + label_text + "}  " + task_text;
            $('#item_' + task_id + '_content').prepend('<i class="superlabel ' + label_class + '"><span class="item_label">' + label_text + '</span></i>');

        }
        changeTaskName(task_id, task_text);

        switch(settings.comments) {
        case "always":
          addNewComment(task_id, label_text);
          break;
        case "never":
          break;
        default:
          askAboutComment(task_id, label_text);
        }
    }

    function askAboutComment(task_id, label_text) {

        var this_label = $('#item_' + task_id + '_content .superlabel');
        this_label.append('<ul class="list"></ul>');
        var this_list = $('.list', this_label);

        this_list.append('<li class="empty"><strong>Comment?</strong>');
        this_list.append('<li><a class="post_new_comment" data-label_text="' + label_text + '">Yes</a> <a class="hide_labels_list">No</a></li></ul>');
    }
}

function changeTaskName(task_id, task_text) {
    if (!checkSettings()) {
        return false;
    }
    $.ajax({
        type: "PUT",
        dataType: 'html',
        contentType: "text/xml",
        data: "<todo-item><content>" + task_text + "</content></todo-item>",
        url: "https://"+ settings.domain +".basecamphq.com/todo_items/"+ task_id +".xml",
        username: settings.token,
        password: "X",
        success: function(data, textStatus, jqXHR){
            if (textStatus == "success") {

            } else {
                sendRequest('data_cant_save', null, function(){});
            }
        }
    });
}

function addNewComment(task_id, label_text) {

    if (!checkSettings()) {
        return false;
    }
    var comment_text;

    if (label_text == '' || label_text == null) {
        comment_text = "Status has been removed";
    } else {
        comment_text = 'Status has been changed to "' + label_text + '"';
    }

    $.ajax({
        type: "POST",
        dataType: 'html',
        contentType: "text/xml",
        data: "<comment><body>" + comment_text + "</body></comment>",
        url: "https://"+ settings.domain +".basecamphq.com/todo_items/"+ task_id +"/comments.xml",
        username: settings.token,
        password: "X",
        success: function(data, textStatus, jqXHR){
            if (textStatus == "success") {

            } else {
                sendRequest('data_cant_save', null, function(){});
            }
        }
    });
}

// service

function checkSettings() {
    if (empty(settings.domain) || empty(settings.token)) {
        sendRequest('empty_settings', null, function(){});
        return false;
    }
    return true;
}

function getWordsBetweenCurlies(str) {
    var results = [], re = /{([^}]+)}/g, text;
    if (text = re.exec(str)) {
        return text[1];
    }
    return false;
}

function empty( mixed_var ) {
    return (mixed_var === undefined || mixed_var === "" || mixed_var === 0 || mixed_var == 'undefined'   || mixed_var === "0" || mixed_var === null  || mixed_var === false );
}

function getDefaultLabels() {
    var labels;
    if (empty(settings.statuses)) {
        labels = "completed,urgent,fixed,could not reproduce,reopen".split(",");
    } else {
        labels = settings.statuses.split(",");
    }
    return labels;
}