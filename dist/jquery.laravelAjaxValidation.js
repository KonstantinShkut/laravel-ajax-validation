(function($) {
    $.fn.laravelAjaxValidation = function(options) {

        var th = this;

        var settings = $.extend({
            // Show error list before the form
            showErrorList: false,
            // Show errors next to inputs
            showInlineErrors: true,
            // Hide form and display success message
            hideFormAfterSuccess: true,
            // Disable form submission after first successful submission
            disableReSubmit: true,
            // Rename submit button during submission
            progressButton: '<i class="fa fa-spinner fa-pulse"></i> &nbsp; Submitting',
            // Rename submit button after failed submission
            retryButton: 'Try again',
            // Rename submit button after successful submission
            doneButton: '<i class="fa fa-check"></i> &nbsp; Done'
        }, options);

        var form = {

            el: $(th),
            token: $(th).find('input[name=_token]').val(),
            errors: $("<ul/>"),

            init: function(el){
                this.el = el;
                return this;
            },

            clearFeedback: function(){
                this.errors = $("<ul/>");
                this.el.find('.messages').remove();
                this.el.find('label.error').remove();
                this.el.find('.form-control-feedback').remove();
                this.el.find('input, select')
                    .closest('.form-group')
                    .removeClass('has-error')
                    .removeClass('has-success');

                return this;
            },

            addMessage: function(message) {

                this.el.before($('<div class="messages alert alert-success" role="alert"/>').append(message));

                return this;
            },

            addError: function(field, errors) {

                var th = this,
                    element = '[name='+field+']';

                th.el.find(element)
                    .closest('.form-group')
                    .addClass('has-feedback')
                    .addClass('has-error')
                    .find('.form-control')
                    .after('<span class="form-control-feedback" aria-hidden="true"><i class="fa fa-times"></i></span>')
                ;

                $.each(errors, function(i, error) {
                    th.errors.append($("<li/>").text(error));

                    if (settings.showInlineErrors) {
                        $(element)
                            .parent()
                            .append('<label class="error" for="'+field+'">'+error+'</label>');
                    }
                });

                return this;
            },

            processErrors: function(errors) {

                var th = this;

                $.each(errors, function(field, errors) {
                    th.addError(field, errors);
                });

                if (settings.showErrorList) {
                    this.el.prepend($('<div class="messages alert alert-danger" role="alert"/>').append(this.errors));
                }

                return this;
            },

            done: function() {

                this.el
                    .off('submit')
                    .on('submit', function(e){
                        e.preventDefault();
                        $(this).closest('.modal').modal('hide');
                    });

                if (settings.hideFormAfterSuccess)
                    form.hide();

                if (settings.disableReSubmit)
                    this.button.rename(settings.doneButton).disable();
                else
                    this.button.restore().enable();
            },

            hide: function() {

                this.el.children(":not(:has([type=submit]))").hide();
            },

            button: {
                el: $(th).find('[type=submit]'),
                initialHtml: $(th).find('[type=submit]').html(),
                init: function(el){
                    this.el = el;
                    this.initialHtml = el.html();
                    return this;
                },
                enable: function(){
                    this.el.prop('disabled', false);
                    return this;
                },
                disable: function(){
                    this.el.prop('disabled', true);
                    return this;
                },
                restore: function(){
                    this.el.html(this.initialHtml);
                    return this;
                },
                rename: function(html){
                    this.el.attr('value', html);
                    this.el.html(html);
                    return this;
                }
            }
        };

        $(this).on('submit',function(e){

            e.preventDefault();

            var $form = $(this);

            form.button.rename(settings.progressButton).disable();

            $.ajax({
                type: 'POST',
                cache: false,
                contentType: false,
                processData: false,
                headers: {
                    'X-CSRF-TOKEN': form.token
                },
                url: $form.attr('action'),
                data: new FormData($form[0]),
                dataType: 'json'
            })

            .done(function(data, textStatus, jqXHR) {

                form.clearFeedback();

                if (data.message)
                    form.addMessage(data.message);

                form.done();
            })

            .fail(function(data, textStatus, jqXHR) {

                form
                    .clearFeedback()
                    .processErrors(data.responseJSON);

                if (settings.retryButton !== undefined)
                    form.button.rename(settings.retryButton);
                else
                    form.button.restore();

                form.button.enable();
            });

        });

        return this;
    };
})(jQuery);