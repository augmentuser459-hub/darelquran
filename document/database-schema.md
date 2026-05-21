# قاعدة البيانات - دار القرآن

## 📊 نظرة عامة

قاعدة البيانات مصممة باحترافية لتغطي جميع احتياجات النظام مع ضمان:
- سلامة البيانات (Data Integrity)
- الأداء العالي (Performance)
- قابلية التوسع (Scalability)
- الأمان (Security)

---

## 🗄️ الجداول (Tables)

### 1. countries - الدول والعملات

```sql
CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    currency_code VARCHAR(3) NOT NULL, -- EGP, SAR, USD
    currency_symbol VARCHAR(10) NOT NULL, -- ج.م, ر.س, $
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**الغرض**: تخزين معلومات الدول والعملات المختلفة

**البيانات المتوقعة**:
- مصر (EGP - ج.م)
- السعودية (SAR - ر.س)
- الإمارات (AED - د.إ)
- الكويت (KWD - د.ك)

---

### 2. pricing_plans - أنظمة التسعير

```sql
CREATE TABLE pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    sessions_per_week INTEGER NOT NULL CHECK (sessions_per_week IN (1, 2, 3)),
    monthly_price DECIMAL(10, 2) NOT NULL CHECK (monthly_price > 0),
    plan_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(country_id, sessions_per_week)
);
```

**الغرض**: تحديد أسعار الخطط المختلفة لكل دولة

**مثال**:
- مصر - حصة واحدة - 200 ج.م
- مصر - حصتين - 350 ج.م
- مصر - 3 حصص - 500 ج.م

---

### 3. teachers - المحفظين

```sql
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**الغرض**: تخزين بيانات المحفظين

---

### 4. students - الطلبة

```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    parent_phone VARCHAR(20),
    email VARCHAR(255),
    country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
    pricing_plan_id UUID REFERENCES pricing_plans(id) ON DELETE SET NULL,
    
    -- نظام الاعتذارات والتحذيرات
    excuse_balance INTEGER DEFAULT 2 CHECK (excuse_balance >= 0),
    warnings_count INTEGER DEFAULT 0 CHECK (warnings_count >= 0),
    
    -- الحالة
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'graduated')),
    
    -- تاريخ البدء والانتهاء
    enrollment_date DATE DEFAULT CURRENT_DATE,
    graduation_date DATE,
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**الغرض**: تخزين بيانات الطلبة مع نظام الاعتذارات والتحذيرات

---

### 5. scheduled_sessions - الحصص المجدولة (الجدول الأسبوعي)

```sql
CREATE TABLE scheduled_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    
    -- الجدول الأسبوعي
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=الأحد, 6=السبت
    session_time TIME NOT NULL,
    session_duration INTEGER DEFAULT 60, -- بالدقائق
    
    -- تاريخ البدء والانتهاء
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE, -- null = مستمر
    
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- منع تضارب المواعيد
    CONSTRAINT no_teacher_conflict UNIQUE (teacher_id, day_of_week, session_time, start_date)
);
```

**الغرض**: تخزين الجدول الأسبوعي الثابت لكل طالب

**مثال**:
- أحمد - الأحد - 5:00 مساءً - مع الشيخ محمد
- أحمد - الثلاثاء - 5:00 مساءً - مع الشيخ محمد

---

### 6. sessions - الحصص الفعلية

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_session_id UUID REFERENCES scheduled_sessions(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    
    -- التاريخ والوقت الفعلي
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    session_duration INTEGER DEFAULT 60,
    
    -- حالة الحصة
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN (
        'scheduled',         -- مجدولة
        'completed',         -- تمت
        'student_excused',   -- اعتذار من الطالب
        'teacher_cancelled', -- إلغاء من المحفظ
        'student_absent',    -- غياب الطالب
        'teacher_absent',    -- غياب المحفظ
        'rescheduled'        -- تم تغيير الموعد
    )),
    
    -- هل هي حصة تعويضية؟
    is_makeup BOOLEAN DEFAULT false,
    makeup_for_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    
    -- التقييم والملاحظات
    student_progress TEXT, -- تقدم الطالب في الحفظ
    teacher_notes TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    
    -- التوقيتات
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**الغرض**: تخزين الحصص الفعلية مع حالتها وملاحظاتها

**الفرق بين scheduled_sessions و sessions**:
- `scheduled_sessions`: الجدول الثابت (كل أحد 5 مساءً)
- `sessions`: الحصص الفعلية (حصة يوم الأحد 15 ديسمبر)

---

### 7. attendance_log - سجل الحضور

```sql
CREATE TABLE attendance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    attendance_type VARCHAR(20) NOT NULL CHECK (attendance_type IN (
        'present',
        'excused',
        'absent',
        'late'
    )),
    
    -- من سجل الحضور
    logged_by VARCHAR(50), -- 'admin', 'teacher', 'system'
    
    notes TEXT,
    
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**الغرض**: سجل تفصيلي لكل عملية تسجيل حضور

---

### 8. invoices - الفواتير الشهرية

```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    -- الفترة
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2024),
    
    -- المبالغ
    base_amount DECIMAL(10, 2) NOT NULL, -- المبلغ الأساسي حسب الخطة
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    additional_charges DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- العملة
    currency_code VARCHAR(3) NOT NULL,
    
    -- عدد الحصص
    expected_sessions INTEGER NOT NULL, -- الحصص المتوقعة
    completed_sessions INTEGER DEFAULT 0, -- الحصص المكتملة
    cancelled_by_teacher INTEGER DEFAULT 0, -- ملغاة من المحفظ (لا تحسب)
    
    -- الحالة
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',   -- قيد الانتظار
        'paid',      -- مدفوعة
        'partial',   -- مدفوعة جزئياً
        'overdue',   -- متأخرة
        'cancelled'  -- ملغاة
    )),
    
    -- تواريخ
    due_date DATE NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(student_id, month, year)
);
```

**الغرض**: الفواتير الشهرية لكل طالب

**كيفية الحساب**:
- المبلغ الأساسي من pricing_plan
- خصم الحصص الملغاة من المحفظ
- إضافة أي رسوم إضافية
- خصم أي تخفيضات

---

### 9. payments - المدفوعات

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    -- المبلغ
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    currency_code VARCHAR(3) NOT NULL,
    
    -- طريقة الدفع
    payment_method VARCHAR(50) CHECK (payment_method IN (
        'cash',
        'bank_transfer',
        'credit_card',
        'paypal',
        'vodafone_cash',
        'instapay',
        'other'
    )),
    
    -- معلومات إضافية
    transaction_reference VARCHAR(255),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- من استلم الدفع
    received_by VARCHAR(100),
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**الغرض**: تسجيل جميع المدفوعات

**ملاحظة**: يمكن أن تكون هناك عدة دفعات لفاتورة واحدة (دفع جزئي)

---

### 10. warnings - التحذيرات

```sql
CREATE TABLE warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    warning_type VARCHAR(50) CHECK (warning_type IN (
        'excessive_excuses',  -- تجاوز الاعتذارات
        'excessive_absences', -- غياب متكرر
        'payment_overdue',    -- تأخر في الدفع
        'behavior',           -- سلوك
        'other'
    )),
    
    reason TEXT NOT NULL,
    action_taken TEXT,
    
    -- الحالة
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated')),
    
    issued_by VARCHAR(100),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**الغرض**: تسجيل جميع التحذيرات الصادرة للطلبة

---

### 11. holidays - العطلات

```sql
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    holiday_date DATE NOT NULL UNIQUE,
    country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
    is_recurring BOOLEAN DEFAULT false, -- هل تتكرر سنوياً
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**الغرض**: تحديد أيام العطلات لتجنب جدولة الحصص فيها

---

### 12. audit_log - سجل التعديلات

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**الغرض**: تسجيل جميع التعديلات على البيانات الحساسة

---

### 13. system_settings - الإعدادات العامة

```sql
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**الغرض**: تخزين إعدادات النظام العامة

**أمثلة**:
- `invoice_due_day`: 5 (تاريخ استحقاق الفاتورة)
- `max_excuses`: 2 (عدد الاعتذارات المسموح)
- `session_duration`: 60 (مدة الحصة بالدقائق)

---

## 📊 الـ Indexes لتحسين الأداء

```sql
-- Indexes للبحث السريع
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_country ON students(country_id);
CREATE INDEX idx_students_pricing_plan ON students(pricing_plan_id);

CREATE INDEX idx_teachers_status ON teachers(status);

CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_sessions_student ON sessions(student_id);
CREATE INDEX idx_sessions_teacher ON sessions(teacher_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_scheduled ON sessions(scheduled_session_id);

CREATE INDEX idx_scheduled_sessions_student ON scheduled_sessions(student_id);
CREATE INDEX idx_scheduled_sessions_teacher ON scheduled_sessions(teacher_id);
CREATE INDEX idx_scheduled_sessions_active ON scheduled_sessions(is_active) WHERE is_active = true;

CREATE INDEX idx_invoices_student_period ON invoices(student_id, year, month);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

CREATE INDEX idx_attendance_session ON attendance_log(session_id);
CREATE INDEX idx_attendance_student ON attendance_log(student_id);

CREATE INDEX idx_warnings_student ON warnings(student_id);
CREATE INDEX idx_warnings_status ON warnings(status);

CREATE INDEX idx_holidays_date ON holidays(holiday_date);

CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
```

**الغرض**: تسريع عمليات البحث والاستعلام

---
