
var ControlMenuModelConstructor = function() {
    this.dropdown_active = false;
    this.menus = {};

    this.initMenus();
};


ControlMenuModelConstructor.prototype = {
    initMenus: function() {
        this.menus = {"File" : {"options" : [{"option": "Open Scenario", "function" : this.file_open_control},
            {"option": "Save", "function" : this.file_save_control},
            {"option": "Settings", "function" : this.file_settings_control},
            {"option": "Exit", "function" : this.file_exit_control}],
            "active" : false},

            "Edit" : {"options" : [{"option": "Undo", "function" : this.edit_undo_control}],
                "active" : false},

            "View" : {"options" : [{"option": "Default", "function" : this.view_default_control}],
                "active" : false},

            "Help" : {"options" : [{"option": "About", "function" : this.help_help_control}],
                "active" : false}};
    },
    file_open_control: function() {
        alert("Under Construction");
    },
    file_save_control: function() {
        print();
    },
    file_settings_control: function() {
        alert("Under Construction");
    },
    file_exit_control: function() {
        alert("Under Construction");
    },
    edit_undo_control: function() {
        alert("Under Construction");
    },
    view_default_control: function() {
        alert("Under Construction");
    },
    help_help_control: function() {
        alert("Under Construction");
    }
};




