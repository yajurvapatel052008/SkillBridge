insert into volunteers (full_name, email, password_hash, title, skill, proficiency, address, city, trust_score)
values
  ('Aarav Mehta', 'aarav.demo@skillbridge.in', 'demo123', 'Graphic Designer', 'graphic design', 92, 'Navrangpura, Near Commerce Six Roads', 'Ahmedabad', 88),
  ('Nisha Reddy', 'nisha.demo@skillbridge.in', 'demo123', 'Frontend Developer', 'web development', 90, 'Madhapur, Near Hitech City Metro', 'Hyderabad', 91),
  ('Rohan Sinha', 'rohan.demo@skillbridge.in', 'demo123', 'Field Plumber', 'plumbing', 86, 'Boring Road, Near Patliputra Colony', 'Patna', 84),
  ('Maya Thomas', 'maya.demo@skillbridge.in', 'demo123', 'Content Strategist', 'content writing', 89, 'Kakkanad, Near InfoPark', 'Kochi', 87),
  ('Priya Shah', 'priya.demo@skillbridge.in', 'demo123', 'Visual Designer', 'graphic design', 84, 'Satellite Road, Near Iskcon Cross Road', 'Ahmedabad', 80),
  ('Kabir Arora', 'kabir.demo@skillbridge.in', 'demo123', 'Full Stack Developer', 'web development', 94, 'Sector 22, Near IFFCO Chowk', 'Gurugram', 93),
  ('Sneha Kulkarni', 'sneha.demo@skillbridge.in', 'demo123', 'UX Writer', 'content writing', 82, 'Baner Road, Near Balewadi High Street', 'Pune', 78),
  ('Imran Sheikh', 'imran.demo@skillbridge.in', 'demo123', 'Emergency Plumber', 'plumbing', 90, 'Andheri West, Near Lokhandwala Circle', 'Mumbai', 89)
on conflict (email) do nothing;

insert into volunteer_availability (volunteer_id, urgency_bucket, start_time, end_time)
select id, 'today', '14:00', '18:00'
from volunteers
where email = 'aarav.demo@skillbridge.in'
  and not exists (
    select 1 from volunteer_availability
    where volunteer_id = volunteers.id and urgency_bucket = 'today'
  );

insert into volunteer_availability (volunteer_id, urgency_bucket, start_time, end_time)
select id, 'tomorrow', '10:00', '16:00'
from volunteers
where email = 'nisha.demo@skillbridge.in'
  and not exists (
    select 1 from volunteer_availability
    where volunteer_id = volunteers.id and urgency_bucket = 'tomorrow'
  );

insert into volunteer_availability (volunteer_id, urgency_bucket, start_time, end_time)
select id, 'today', '13:00', '17:00'
from volunteers
where email = 'rohan.demo@skillbridge.in'
  and not exists (
    select 1 from volunteer_availability
    where volunteer_id = volunteers.id and urgency_bucket = 'today'
  );

insert into volunteer_availability (volunteer_id, urgency_bucket, start_time, end_time)
select id, 'this_week', '09:00', '13:00'
from volunteers
where email = 'maya.demo@skillbridge.in'
  and not exists (
    select 1 from volunteer_availability
    where volunteer_id = volunteers.id and urgency_bucket = 'this_week'
  );

insert into volunteer_availability (volunteer_id, urgency_bucket, start_time, end_time)
select id, 'today', '15:00', '19:00'
from volunteers
where email = 'priya.demo@skillbridge.in'
  and not exists (
    select 1 from volunteer_availability
    where volunteer_id = volunteers.id and urgency_bucket = 'today'
  );

insert into volunteer_availability (volunteer_id, urgency_bucket, start_time, end_time)
select id, 'today', '11:00', '18:00'
from volunteers
where email = 'kabir.demo@skillbridge.in'
  and not exists (
    select 1 from volunteer_availability
    where volunteer_id = volunteers.id and urgency_bucket = 'today'
  );

insert into volunteer_availability (volunteer_id, urgency_bucket, start_time, end_time)
select id, 'tomorrow', '12:00', '17:00'
from volunteers
where email = 'sneha.demo@skillbridge.in'
  and not exists (
    select 1 from volunteer_availability
    where volunteer_id = volunteers.id and urgency_bucket = 'tomorrow'
  );

insert into volunteer_availability (volunteer_id, urgency_bucket, start_time, end_time)
select id, 'today', '09:00', '14:00'
from volunteers
where email = 'imran.demo@skillbridge.in'
  and not exists (
    select 1 from volunteer_availability
    where volunteer_id = volunteers.id and urgency_bucket = 'today'
  );
