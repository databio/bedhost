var rules_basic = {
  rules: [{
    id: 'num_regions',
    operator: 'less',
    value: 10
  }]
};

$('#builder-basic').queryBuilder({
  plugins: {
    'bt-tooltip-errors': null
  },
  filters: [{
  id: 'num_regions',
  label: 'Regions count',
  type: 'integer',
  validation: {
    min: 1,
    step: 0.01
  }
  }],
  rules: rules_basic
});

$('#btn-reset').on('click', function() {
  $('#builder-basic').queryBuilder('reset');
});

$('#btn-get-elastic').on('click', function() {
  var result = $('#builder-basic').queryBuilder('getESBool');

$.ajax({
    url: "/bedfiles_filter_result",
    type: "POST",
    data: JSON.stringify(result),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    });

  if (!$.isEmptyObject(result)) {
    alert(JSON.stringify(result, null, 2));
  }
});
