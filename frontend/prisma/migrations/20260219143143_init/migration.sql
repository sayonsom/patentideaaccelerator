-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cognito_sub" TEXT,
    "interests" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ideas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sprint_id" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "problem_statement" TEXT NOT NULL DEFAULT '',
    "existing_approach" TEXT NOT NULL DEFAULT '',
    "proposed_solution" TEXT NOT NULL DEFAULT '',
    "technical_approach" TEXT NOT NULL DEFAULT '',
    "contradiction_resolved" TEXT NOT NULL DEFAULT '',
    "prior_art_notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "phase" TEXT NOT NULL DEFAULT 'foundation',
    "tech_stack" JSONB NOT NULL DEFAULT '[]',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "score" JSONB,
    "alice_score" JSONB,
    "framework_used" TEXT NOT NULL DEFAULT 'none',
    "framework_data" JSONB NOT NULL DEFAULT '{}',
    "claim_draft" JSONB,
    "red_team_notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "session_mode" TEXT NOT NULL DEFAULT 'quantity',
    "phase" TEXT NOT NULL DEFAULT 'foundation',
    "timer_seconds_remaining" INTEGER NOT NULL DEFAULT 259200,
    "timer_running" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprint_members" (
    "sprint_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "sprint_members_pkey" PRIMARY KEY ("sprint_id","user_id")
);

-- CreateTable
CREATE TABLE "prior_art_results" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "query_text" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "searched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prior_art_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '#4F83CC',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alignment_scores" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rationale" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "alignment_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cognito_sub_key" ON "users"("cognito_sub");

-- CreateIndex
CREATE UNIQUE INDEX "alignment_scores_idea_id_goal_id_key" ON "alignment_scores"("idea_id", "goal_id");

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_members" ADD CONSTRAINT "sprint_members_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_members" ADD CONSTRAINT "sprint_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prior_art_results" ADD CONSTRAINT "prior_art_results_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_goals" ADD CONSTRAINT "business_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alignment_scores" ADD CONSTRAINT "alignment_scores_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alignment_scores" ADD CONSTRAINT "alignment_scores_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "business_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
