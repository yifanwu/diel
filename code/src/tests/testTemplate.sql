-- TEST: single
create template t(v)
  select {v} from flights;

-- TEST: double
create template t(v, a)
  select {v}, {a} from flights;